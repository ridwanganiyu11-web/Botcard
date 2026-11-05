import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Loader2,
  UserX,
  AlertCircle,
  ExternalLink,
  User,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  PROFILE_BUSINESS,
  ProfileData,
  isValidWalletAddress,
  normalizeWalletAddress,
} from "../utils/validation";
import {
  fetchProfileFromChain,
  formatContractError,
  OnChainActivityEvent,
  verifyContractDeployed,
} from "../utils/contract";
import { ProfileCard } from "../components/ProfileCard";
import { QRCode } from "../components/QRCode";
import { shortenAddress } from "../utils/network";

interface ExploreProps {
  recentEvents: OnChainActivityEvent[];
  connectedWallet?: string | null;
}

export const Explore: React.FC<ExploreProps> = ({
  recentEvents,
  connectedWallet,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [resultProfile, setResultProfile] = useState<ProfileData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const performLookup = async (addressToQuery: string) => {
    const trimmed = addressToQuery.trim();
    setSearchError(null);
    setResultProfile(null);
    setSearchedAddress(null);

    if (!trimmed) {
      setSearchError("Please enter a Botchain wallet address (0x...).");
      return;
    }

    if (!isValidWalletAddress(trimmed)) {
      setSearchError(
        "Invalid wallet address format. Please enter a valid 42-character hexadecimal address starting with 0x."
      );
      return;
    }

    const normalized = normalizeWalletAddress(trimmed)!;
    setSearchedAddress(normalized);
    setIsSearching(true);

    try {
      const deployed = await verifyContractDeployed();
      if (!deployed) {
        setSearchError(
          "BotCardRegistry contract is not yet deployed or configured on Botchain Testnet."
        );
        return;
      }

      const data = await fetchProfileFromChain(normalized);
      setResultProfile(data);
    } catch (err: unknown) {
      setSearchError(formatContractError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLookup(searchInput);
  };

  // Deduplicate recent wallets from events for quick lookup suggestions
  const uniqueRecentWallets = Array.from(
    new Map(recentEvents.map((ev) => [ev.wallet.toLowerCase(), ev])).values()
  ).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3 pt-4">
        <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
          Direct On-Chain Lookup • O(1) Gas-Free Read
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Explore BotCard Profiles
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Look up any Personal or Business contact card directly from{" "}
          <code className="font-mono text-slate-300">BotCardRegistry.getProfile(address)</code>{" "}
          using a Botchain wallet address.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="glass-panel rounded-2xl p-3 border border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-xl"
        >
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              aria-label="Wallet address search"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm font-mono text-white placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg transition-all disabled:opacity-60"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Profile</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Lookup Helper Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 px-1">
          <span>Quick lookup:</span>
          {connectedWallet && (
            <button
              type="button"
              onClick={() => {
                setSearchInput(connectedWallet);
                performLookup(connectedWallet);
              }}
              className="px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 font-mono transition-colors"
            >
              My Wallet ({shortenAddress(connectedWallet, 4)})
            </button>
          )}
          {uniqueRecentWallets.map((ev) => (
            <button
              key={ev.wallet}
              type="button"
              onClick={() => {
                setSearchInput(ev.wallet);
                performLookup(ev.wallet);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono transition-colors"
            >
              {shortenAddress(ev.wallet, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Validation / RPC Error */}
      {searchError && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs sm:text-sm text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Search Result Display */}
      {searchedAddress && !isSearching && !searchError && (
        <div className="max-w-4xl mx-auto space-y-4">
          {!resultProfile || !resultProfile.exists ? (
            <div className="glass-panel rounded-3xl p-10 text-center space-y-4 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <UserX className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                No Profile Registered for This Address
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Address <span className="font-mono text-slate-200 break-all">{searchedAddress}</span>{" "}
                was checked on BotCardRegistry and does not currently own a registered contact card.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>On-Chain Profile Found</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      resultProfile.profileType === PROFILE_BUSINESS
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        : "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    }`}
                  >
                    {resultProfile.profileType === PROFILE_BUSINESS ? (
                      <>
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Business Category (1)</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>Personal Category (0)</span>
                      </>
                    )}
                  </span>
                </div>

                <Link
                  to={`/profile/${searchedAddress}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
                >
                  <span>Open Dedicated Public Profile Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <ProfileCard
                profile={resultProfile}
                walletAddress={searchedAddress}
                isVerifiedOnChain={true}
                showActions={true}
                onShowQr={() => setShowQr(true)}
              />
            </div>
          )}
        </div>
      )}

      {showQr && searchedAddress && resultProfile?.exists && (
        <QRCode
          walletAddress={searchedAddress}
          profileName={resultProfile.name}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
};


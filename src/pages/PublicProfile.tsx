import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  UserX,
  Compass,
  PlusCircle,
} from "lucide-react";
import {
  ProfileData,
  isValidWalletAddress,
  normalizeWalletAddress,
} from "../utils/validation";
import {
  fetchProfileEvents,
  fetchProfileFromChain,
  formatContractError,
  OnChainActivityEvent,
  verifyContractDeployed,
} from "../utils/contract";
import { ProfileCard } from "../components/ProfileCard";
import { QRCode } from "../components/QRCode";
import { TransactionHistoryList } from "../components/TransactionStatus";
import { BOTCHAIN_CHAIN_ID } from "../utils/network";

export const PublicProfile: React.FC = () => {
  const { walletAddress } = useParams<{ walletAddress: string }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const [events, setEvents] = useState<OnChainActivityEvent[]>([]);
  const [eventsAvailable, setEventsAvailable] = useState(false);
  const [eventsReason, setEventsReason] = useState<string | undefined>(undefined);

  const rawAddress = (walletAddress || "").trim();
  const isValidAddr = isValidWalletAddress(rawAddress);
  const normalizedAddr = normalizeWalletAddress(rawAddress) || rawAddress;

  useEffect(() => {
    let active = true;

    async function loadPublicProfile() {
      if (!isValidAddr) {
        setIsLoading(false);
        setError("Invalid wallet address format.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const deployed = await verifyContractDeployed();
        if (!deployed) {
          if (active) {
            setError(
              "BotCardRegistry smart contract is not yet deployed or configured for this client."
            );
            setIsLoading(false);
          }
          return;
        }

        const data = await fetchProfileFromChain(normalizedAddr);
        const evResult = await fetchProfileEvents(normalizedAddr);
        if (active) {
          setProfile(data);
          setEvents(evResult.events);
          setEventsAvailable(evResult.available);
          setEventsReason(evResult.reason);
        }
      } catch (err: unknown) {
        if (active) {
          setError(formatContractError(err));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadPublicProfile();
    return () => {
      active = false;
    };
  }, [rawAddress, isValidAddr, normalizedAddr]);

  if (!isValidAddr) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-rose-500/30">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Invalid Wallet Address</h1>
          <p className="text-sm text-slate-400">
            The URL address <span className="font-mono text-rose-300 break-all">{rawAddress}</span> is not a valid Ethereum / Botchain wallet address.
          </p>
          <div className="pt-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white"
            >
              <Compass className="w-4 h-4" />
              <span>Search Another Address</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Public On-Chain Profile • No Wallet Required to View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            BotCard Public Profile
          </h1>
        </div>

        <Link
          to="/explore"
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
        >
          <Compass className="w-4 h-4 text-violet-400" />
          <span>Lookup Another Wallet</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            Reading public profile for <span className="font-mono">{normalizedAddr}</span> from Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})...
          </p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-3xl p-8 border border-amber-500/30 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Unable to Read Contract State</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
        </div>
      ) : !profile || !profile.exists ? (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-5 border border-slate-800 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <UserX className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              No Registered BotCard Found
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              The wallet address{" "}
              <span className="font-mono text-slate-200 break-all">{normalizedAddr}</span>{" "}
              has not registered a Personal or Business contact card on Botchain Testnet yet.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <Compass className="w-4 h-4" />
              <span>Search Another Address</span>
            </Link>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Is this your wallet? Create Card</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <ProfileCard
              profile={profile}
              walletAddress={normalizedAddr}
              isVerifiedOnChain={true}
              showActions={true}
              onShowQr={() => setShowQrModal(true)}
            />

            <TransactionHistoryList
              events={events}
              available={eventsAvailable}
              reason={eventsReason}
              title="On-Chain Verification & Update History"
            />
          </div>

          <div className="lg:col-span-4">
            <QRCode
              walletAddress={normalizedAddr}
              profileName={profile.name}
              inline={true}
            />
          </div>
        </div>
      )}

      {showQrModal && profile?.exists && (
        <QRCode
          walletAddress={normalizedAddr}
          profileName={profile.name}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};


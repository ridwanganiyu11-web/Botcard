import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Compass,
  Wallet,
  ShieldCheck,
  QrCode,
  Download,
  Users,
  Activity,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
} from "lucide-react";
import { WalletState } from "../hooks/useWallet";
import {
  BOTCHAIN_CHAIN_ID,
  getExplorerTxUrl,
  shortenAddress,
} from "../utils/network";
import { OnChainActivityEvent } from "../utils/contract";
import { PROFILE_BUSINESS } from "../utils/validation";

interface HomeProps {
  wallet: WalletState;
  contractAddress: string;
  isContractVerified: boolean;
  totalProfiles: number | null;
  activityEvents: OnChainActivityEvent[];
  activityAvailable: boolean;
  activityReason?: string;
  isLoadingActivity: boolean;
  onRefreshActivity: () => void;
}

export const Home: React.FC<HomeProps> = ({
  wallet,
  contractAddress,
  isContractVerified,
  totalProfiles,
  activityEvents,
  activityAvailable,
  activityReason,
  isLoadingActivity,
  onRefreshActivity,
}) => {
  useEffect(() => {
    onRefreshActivity();
  }, [onRefreshActivity]);

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Decentralized Web3 Contact Registry • Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your Identity. Your Wallet.{" "}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Your Card.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create, manage, and share your digital identity on Botchain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-xl shadow-violet-600/25 transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Your Card</span>
            </Link>

            <Link
              to="/explore"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-slate-100 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all hover:-translate-y-0.5"
            >
              <Compass className="w-5 h-5 text-blue-400" />
              <span>Explore Profiles</span>
            </Link>
          </div>
        </div>

        {/* Live Status Dashboard Strip */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Connected Wallet Status */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Connected Wallet Status
              </span>
              {wallet.isConnected && wallet.address ? (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-sm font-bold text-white truncate">
                      {wallet.shortAddress}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {wallet.balanceBot !== null
                      ? `Balance: ${wallet.balanceBot} BOT`
                      : "Wallet connected"}
                  </p>
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-300">Not Connected</p>
                  <button
                    type="button"
                    onClick={wallet.connectWallet}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline"
                  >
                    Connect Wallet now →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Botchain Network Indicator */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Botchain Network Status
              </span>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      !wallet.isConnected || wallet.isCorrectChain
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />
                  <span className="text-sm font-bold text-white">
                    Botchain Testnet (ID {BOTCHAIN_CHAIN_ID})
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {isContractVerified && contractAddress
                    ? `Contract: ${shortenAddress(contractAddress, 6)}`
                    : contractAddress
                    ? "Awaiting contract deployment on RPC"
                    : "Contract address not yet configured"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Total Profiles Registered */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Profiles Registered
              </span>
              <div className="mt-1 space-y-1">
                {totalProfiles !== null ? (
                  <>
                    <p className="text-2xl font-extrabold text-white">{totalProfiles}</p>
                    <p className="text-xs text-emerald-400">
                      Live from BotCardRegistry on-chain counter
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-300">
                      Awaiting Contract Deployment
                    </p>
                    <p className="text-xs text-slate-400">
                      Deploy BotCardRegistry to view live count
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How BotCard Works Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How BotCard Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Four simple steps to anchor your personal or business contact card on Botchain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Connect Your Wallet</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Connect MetaMask or any Web3 wallet to Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}). Your wallet address serves as your cryptographic identity.
            </p>
          </div>

          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Choose Personal or Business</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Select a Personal Card (0) for individual professionals or a Business Card (1) for companies, DAOs, and Web3 teams.
            </p>
          </div>

          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Publish On-Chain</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Sign a single lightweight transaction on BotCardRegistry.sol. Update your details anytime with full wallet ownership verification.
            </p>
          </div>

          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold">
              04
            </div>
            <h3 className="text-lg font-bold text-white">Share via URL, QR &amp; VCF</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Share your public profile link with anyone—no wallet required to view—or export as a QR code PNG and phone-ready .vcf vCard.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Profile Activity Section */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recent Profile Activity</h2>
              <p className="text-xs text-slate-400">
                Live ProfileUpdated events emitted by BotCardRegistry on Botchain
              </p>
            </div>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
          >
            <span>Lookup Any Wallet Address</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingActivity ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Loading recent on-chain activity from Botchain RPC...
          </div>
        ) : !activityAvailable ? (
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs sm:text-sm text-slate-400">
            <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">
                Recent on-chain activity is not yet available
              </p>
              <p className="mt-1">
                {activityReason ||
                  "Deploy BotCardRegistry and set VITE_CONTRACT_ADDRESS to stream live ProfileUpdated events."}
              </p>
            </div>
          </div>
        ) : activityEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-sm text-slate-400">
            No recent ProfileUpdated events found in the latest Botchain blocks. Be the first to create a card!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activityEvents.slice(0, 6).map((ev, i) => (
              <div
                key={`${ev.txHash}-${i}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 hover:border-violet-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      ev.profileType === PROFILE_BUSINESS
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-violet-500/15 text-violet-400"
                    }`}
                  >
                    {ev.profileType === PROFILE_BUSINESS ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/profile/${ev.wallet}`}
                      className="font-mono text-xs sm:text-sm font-semibold text-white hover:text-violet-300 truncate block"
                    >
                      {shortenAddress(ev.wallet, 6)}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {ev.profileType === PROFILE_BUSINESS ? "Business Card" : "Personal Card"} • Block #{ev.blockNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/profile/${ev.wallet}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    View Card
                  </Link>
                  <a
                    href={getExplorerTxUrl(ev.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    title="View Transaction on Botchain Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-violet-900/40 via-indigo-900/40 to-blue-900/40 border border-violet-500/30 text-center space-y-5 shadow-glow">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Ready to Claim Your On-Chain Contact Card?
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Create your verifiable Personal or Business BotCard in seconds. Share it anywhere via URL, QR code, or standard vCard (.vcf) contact file.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your Card Now</span>
          </Link>
          <Link
            to="/my-profile"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700"
          >
            <QrCode className="w-4 h-4 text-violet-400" />
            <span>View My Profile</span>
          </Link>
        </div>
      </section>
    </div>
  );
};


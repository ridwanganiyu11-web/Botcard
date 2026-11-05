import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { WalletState } from "../hooks/useWallet";
import { ProfileData, ProfileFormData } from "../utils/validation";
import { ProfileCard } from "../components/ProfileCard";
import { ProfileForm } from "../components/ProfileForm";
import { QRCode } from "../components/QRCode";
import {
  TransactionHistoryList,
  TransactionStatus,
} from "../components/TransactionStatus";
import { TxLifecycleStatus } from "../hooks/useBotCard";
import { OnChainActivityEvent } from "../utils/contract";

interface MyProfileProps {
  wallet: WalletState;
  profile: ProfileData | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  txStatus: TxLifecycleStatus;
  txHash: string | null;
  txBlockNumber: number | null;
  txError: string | null;
  activityEvents: OnChainActivityEvent[];
  activityAvailable: boolean;
  activityReason?: string;
  isLoadingActivity: boolean;
  onRefreshProfile: () => Promise<ProfileData | null>;
  onRefreshActivity: (wallet?: string) => Promise<void>;
  onUpdateProfile: (data: ProfileFormData) => Promise<ProfileData | null>;
  onResetTx: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({
  wallet,
  profile,
  isLoadingProfile,
  profileError,
  txStatus,
  txHash,
  txBlockNumber,
  txError,
  activityEvents,
  activityAvailable,
  activityReason,
  isLoadingActivity,
  onRefreshProfile,
  onRefreshActivity,
  onUpdateProfile,
  onResetTx,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (wallet.address) {
      onRefreshActivity(wallet.address);
    }
  }, [wallet.address, onRefreshActivity]);

  const isSubmitting =
    txStatus === "validating" ||
    txStatus === "awaiting_signature" ||
    txStatus === "pending";

  const handleUpdateSubmit = async (formData: ProfileFormData) => {
    const updated = await onUpdateProfile(formData);
    if (updated) {
      setIsEditing(false);
    }
  };

  if (!wallet.isConnected || !wallet.address) {
    return (
      <div className="max-w-2xl mx-auto py-14">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-5 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Connect Your Wallet to View Your Profile
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Connect MetaMask or your Web3 wallet to load your registered BotCard from Botchain Testnet, edit your details, or generate your QR code.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={wallet.connectWallet}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
            Self-Sovereign Contact Card
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            {isEditing ? "Edit My BotCard Profile" : "My BotCard Profile"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            All profile fields are retrieved directly from BotCardRegistry on Botchain Testnet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {profile?.exists && (
            <Link
              to={`/profile/${wallet.address}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-violet-300 border border-slate-700 transition-colors"
            >
              <span>Public Profile URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              onRefreshProfile();
              if (wallet.address) onRefreshActivity(wallet.address);
            }}
            disabled={isLoadingProfile}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfile ? "animate-spin" : ""}`} />
            <span>Refresh from Chain</span>
          </button>
        </div>
      </div>

      {/* Transaction Status Banner */}
      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        blockNumber={txBlockNumber}
        error={txError}
        onDismiss={onResetTx}
      />

      {isLoadingProfile ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            Reading profile from BotCardRegistry on Botchain Testnet...
          </p>
        </div>
      ) : profileError ? (
        <div className="glass-panel rounded-3xl p-8 border border-amber-500/30 space-y-4">
          <div className="flex items-start gap-3 text-amber-200">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold">Could Not Load Profile from Contract</h3>
              <p className="text-xs sm:text-sm text-amber-200/80 mt-1">{profileError}</p>
            </div>
          </div>
        </div>
      ) : !profile || !profile.exists ? (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-5 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/15 text-violet-400 flex items-center justify-center mx-auto">
            <PlusCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white">
              No BotCard Registered for This Wallet Yet
            </h2>
            <p className="text-sm text-slate-400">
              Wallet <span className="font-mono text-slate-200">{wallet.shortAddress}</span> does not have a profile registered on Botchain Testnet yet.
            </p>
          </div>
          <div>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your BotCard Now</span>
            </Link>
          </div>
        </div>
      ) : isEditing ? (
        <ProfileForm
          initialData={{
            name: profile.name,
            headline: profile.headline,
            bio: profile.bio,
            email: profile.email,
            website: profile.website,
            socialHandle: profile.socialHandle,
            location: profile.location,
            profileType: profile.profileType,
          }}
          walletAddress={wallet.address}
          isEditMode={true}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <ProfileCard
              profile={profile}
              walletAddress={wallet.address}
              isVerifiedOnChain={true}
              showActions={true}
              onEdit={() => {
                onResetTx();
                setIsEditing(true);
              }}
              onShowQr={() => setShowQrModal(true)}
            />

            <TransactionHistoryList
              events={activityEvents}
              available={activityAvailable}
              reason={activityReason}
              isLoading={isLoadingActivity}
              title="My Profile Transaction History"
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <QRCode
              walletAddress={wallet.address}
              profileName={profile.name}
              inline={true}
            />
          </div>
        </div>
      )}

      {showQrModal && wallet.address && (
        <QRCode
          walletAddress={wallet.address}
          profileName={profile?.name}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};


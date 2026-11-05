import React from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { WalletState } from "../hooks/useWallet";
import { ProfileData, ProfileFormData } from "../utils/validation";
import { ProfileForm } from "../components/ProfileForm";
import { TransactionStatus } from "../components/TransactionStatus";
import { TxLifecycleStatus } from "../hooks/useBotCard";
import { BOTCHAIN_CHAIN_ID } from "../utils/network";

interface CreateCardProps {
  wallet: WalletState;
  existingProfile: ProfileData | null;
  isLoadingProfile: boolean;
  txStatus: TxLifecycleStatus;
  txHash: string | null;
  txBlockNumber: number | null;
  txError: string | null;
  contractAddress: string;
  onCreateProfile: (data: ProfileFormData) => Promise<ProfileData | null>;
  onResetTx: () => void;
}

export const CreateCard: React.FC<CreateCardProps> = ({
  wallet,
  existingProfile,
  isLoadingProfile,
  txStatus,
  txHash,
  txBlockNumber,
  txError,
  contractAddress,
  onCreateProfile,
  onResetTx,
}) => {
  const isSubmitting =
    txStatus === "validating" ||
    txStatus === "awaiting_signature" ||
    txStatus === "pending";

  const handleSubmit = async (formData: ProfileFormData) => {
    await onCreateProfile(formData);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
            On-Chain Identity Minting
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            Create Your BotCard Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish your Personal (0) or Business (1) contact card directly to BotCardRegistry on Botchain Testnet.
          </p>
        </div>
      </div>

      {/* Contract Not Configured Banner */}
      {!contractAddress && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">BotCardRegistry Contract Not Yet Configured</p>
            <p className="mt-1 text-amber-200/80">
              You can preview your card below, but saving on-chain requires deploying{" "}
              <code className="font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                BotCardRegistry.sol
              </code>{" "}
              to Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}) or configuring the contract address on the About page.
            </p>
          </div>
        </div>
      )}

      {/* Wallet Not Connected Notice */}
      {!wallet.isConnected && (
        <div className="glass-panel rounded-2xl p-6 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Connect Your Wallet to Publish On-Chain
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                You can fill out the form and test the live preview now. Connect MetaMask when ready to save.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={wallet.connectWallet}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        </div>
      )}

      {/* Already Has Profile Notice */}
      {wallet.isConnected && !isLoadingProfile && existingProfile?.exists && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-200">
                Your Wallet Already Has a Registered BotCard Profile!
              </h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Each wallet owns one profile on BotCardRegistry. Visit My Profile to view or edit your existing card.
              </p>
            </div>
          </div>
          <Link
            to="/my-profile"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to My Profile &amp; Edit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Transaction Lifecycle Status */}
      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        blockNumber={txBlockNumber}
        error={txError}
        onDismiss={onResetTx}
      />

      {/* Profile Creation Form & Live Preview */}
      <ProfileForm
        walletAddress={wallet.address}
        isEditMode={false}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};


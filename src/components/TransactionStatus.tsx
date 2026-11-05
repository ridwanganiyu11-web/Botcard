import React from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Activity,
} from "lucide-react";
import { TxLifecycleStatus } from "../hooks/useBotCard";
import { OnChainActivityEvent } from "../utils/contract";
import {
  getExplorerBlockUrl,
  getExplorerTxUrl,
  shortenAddress,
} from "../utils/network";
import { PROFILE_BUSINESS } from "../utils/validation";

interface TransactionStatusProps {
  status: TxLifecycleStatus;
  txHash: string | null;
  blockNumber?: number | null;
  error: string | null;
  onDismiss?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  blockNumber,
  error,
  onDismiss,
}) => {
  if (status === "idle") return null;

  return (
    <div
      className={`rounded-2xl p-4 border mb-6 transition-all ${
        status === "confirmed"
          ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-100"
          : status === "failed"
          ? "bg-rose-500/10 border-rose-500/35 text-rose-100"
          : "bg-violet-500/10 border-violet-500/35 text-violet-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {(status === "validating" ||
            status === "awaiting_signature" ||
            status === "pending") && (
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0 mt-0.5" />
          )}
          {status === "confirmed" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {status === "failed" && (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              {status === "validating" && "Validating profile and verifying network..."}
              {status === "awaiting_signature" &&
                "Waiting for wallet approval — please confirm the transaction in MetaMask..."}
              {status === "pending" &&
                "Transaction broadcast! Waiting for Botchain Testnet confirmation..."}
              {status === "confirmed" &&
                "Transaction confirmed on Botchain Testnet! Profile saved on-chain."}
              {status === "failed" && "Transaction could not be completed"}
            </p>

            {error && <p className="text-xs text-rose-300 leading-relaxed">{error}</p>}

            {txHash && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
                <span>Tx: {shortenAddress(txHash, 8)}</span>
                {blockNumber && (
                  <a
                    href={getExplorerBlockUrl(blockNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    Block #{blockNumber}
                  </a>
                )}
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans font-medium text-violet-300 hover:text-white underline"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (status === "confirmed" || status === "failed") && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

interface TransactionHistoryListProps {
  events: OnChainActivityEvent[];
  available: boolean;
  reason?: string;
  isLoading?: boolean;
  title?: string;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  events,
  available,
  reason,
  isLoading = false,
  title = "On-Chain Transaction Activity",
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Botchain Events</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span>Querying Botchain Testnet event logs...</span>
        </div>
      ) : !available ? (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-300">
              On-chain transaction history is currently unavailable
            </p>
            <p className="mt-0.5">
              {reason ||
                "No contract event logs could be retrieved from the RPC at this time."}
            </p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 text-center">
          No profile creation or update transactions found in recent Botchain blocks.
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.slice(0, 8).map((ev, idx) => {
            const isInitial = idx === events.length - 1;
            return (
              <div
                key={`${ev.txHash}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Confirmed
                    </span>
                    <span className="font-semibold text-slate-200">
                      {isInitial ? "Profile Created / Updated" : "Profile Updated"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        ev.profileType === PROFILE_BUSINESS
                          ? "bg-blue-500/15 text-blue-300"
                          : "bg-violet-500/15 text-violet-300"
                      }`}
                    >
                      {ev.profileType === PROFILE_BUSINESS ? "Business" : "Personal"}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono flex flex-wrap items-center gap-3">
                    <span>Wallet: {shortenAddress(ev.wallet, 6)}</span>
                    <span>Tx: {shortenAddress(ev.txHash, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <a
                    href={getExplorerBlockUrl(ev.blockNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-slate-400 hover:text-slate-200"
                  >
                    Block #{ev.blockNumber}
                  </a>
                  <a
                    href={getExplorerTxUrl(ev.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 font-medium transition-colors"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


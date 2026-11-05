import React, { useState } from "react";
import {
  Wallet,
  Copy,
  Check,
  LogOut,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { WalletState } from "../hooks/useWallet";
import { BOTCHAIN_CHAIN_ID, getExplorerAddressUrl } from "../utils/network";

interface WalletConnectProps {
  wallet: WalletState;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ wallet }) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = async () => {
    const ok = await wallet.copyAddress();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet.isConnected || !wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={wallet.connectWallet}
          disabled={wallet.isConnecting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-600/25 transition-all duration-200 disabled:opacity-60"
        >
          <Wallet className="w-4 h-4" />
          <span>{wallet.isConnecting ? "Connecting..." : "Connect Wallet"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {!wallet.isCorrectChain ? (
        <button
          type="button"
          onClick={wallet.switchToBotchain}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-all"
          title={`Switch to Botchain Testnet (Chain ID ${BOTCHAIN_CHAIN_ID})`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Switch to Botchain ({BOTCHAIN_CHAIN_ID})</span>
        </button>
      ) : (
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Botchain ({BOTCHAIN_CHAIN_ID})</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 border border-slate-700/80 transition-all"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
        <span className="font-mono text-xs sm:text-sm">{wallet.shortAddress}</span>
        {wallet.balanceBot !== null && (
          <span className="hidden md:inline-block text-xs text-slate-400 border-l border-slate-700 pl-2">
            {wallet.balanceBot} BOT
          </span>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-12 w-72 rounded-2xl glass-panel p-4 z-50 border border-slate-700/90 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Connected Wallet
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                wallet.isCorrectChain
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              }`}
            >
              {wallet.isCorrectChain ? `Chain ${BOTCHAIN_CHAIN_ID}` : `Wrong Chain (${wallet.chainId ?? "?"})`}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 mb-3">
            <p className="font-mono text-xs text-slate-300 break-all">{wallet.address}</p>
            {wallet.balanceBot !== null && (
              <p className="text-xs text-violet-300 font-medium mt-1.5">
                Balance: {wallet.balanceBot} BOT
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
              <span>{copied ? "Address Copied!" : "Copy Wallet Address"}</span>
            </button>

            <a
              href={getExplorerAddressUrl(wallet.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>View on Botchain Explorer</span>
            </a>

            {!wallet.isCorrectChain && (
              <button
                type="button"
                onClick={async () => {
                  await wallet.switchToBotchain();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/15 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Switch to Botchain Testnet</span>
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await wallet.disconnectWallet();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/15 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


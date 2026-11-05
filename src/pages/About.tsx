import React, { useState } from "react";
import {
  Shield,
  Cpu,
  Zap,
  Globe,
  CheckCircle2,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTCHAIN_NETWORK_INFO,
  BOTCHAIN_RPC_URL,
  switchOrAddBotchainNetwork,
} from "../utils/network";
import { setCustomContractAddress } from "../utils/contract";
import { isValidWalletAddress } from "../utils/validation";

interface AboutProps {
  contractAddress: string;
  isContractVerified: boolean;
  onContractAddressUpdated: () => Promise<void>;
}

export const About: React.FC<AboutProps> = ({
  contractAddress,
  isContractVerified,
  onContractAddressUpdated,
}) => {
  const [customAddrInput, setCustomAddrInput] = useState(contractAddress);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [configErr, setConfigErr] = useState<string | null>(null);

  const handleSaveContractAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg(null);
    setConfigErr(null);

    const trimmed = customAddrInput.trim();
    if (trimmed && !isValidWalletAddress(trimmed)) {
      setConfigErr("Please enter a valid 0x contract address.");
      return;
    }

    try {
      setCustomContractAddress(trimmed);
      await onContractAddressUpdated();
      setConfigMsg(
        trimmed
          ? "Contract address updated and verified against Botchain RPC."
          : "Reset to default environment/ABI contract address."
      );
    } catch (err: unknown) {
      setConfigErr(err instanceof Error ? err.message : "Could not save contract address");
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800/80 pb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
          Architecture, Network &amp; Security
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          About BotCard DApp
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          BotCard is a decentralized digital contact card registry built on{" "}
          <strong className="text-slate-200">Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})</strong>.
          It enables any Web3 user or organization to publish a verifiable Personal or Business
          contact card directly on-chain with zero centralized servers or paid APIs.
        </p>
      </div>

      {/* Network Specification & Contract Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botchain Testnet Specs */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Botchain Testnet Configuration</h2>
              <p className="text-xs text-slate-400">Verified public network parameters</p>
            </div>
          </div>

          <dl className="space-y-2.5 text-xs sm:text-sm bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 font-mono">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Network Name:</dt>
              <dd className="text-white font-semibold">{BOTCHAIN_NETWORK_INFO.chainName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Chain ID:</dt>
              <dd className="text-violet-300 font-semibold">
                {BOTCHAIN_CHAIN_ID} ({BOTCHAIN_NETWORK_INFO.chainIdHex})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">RPC Endpoint:</dt>
              <dd className="text-slate-200 truncate">{BOTCHAIN_RPC_URL}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Native Token:</dt>
              <dd className="text-emerald-300 font-semibold">
                BOT ({BOTCHAIN_NETWORK_INFO.totalSupply})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Block Explorer:</dt>
              <dd>
                <a
                  href={BOTCHAIN_EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <span>{BOTCHAIN_EXPLORER_URL}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => switchOrAddBotchainNetwork().catch(() => {})}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 border border-violet-500/30 transition-colors"
          >
            Add / Switch to Botchain Testnet in MetaMask
          </button>
        </div>

        {/* Smart Contract Configuration */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">BotCardRegistry Contract</h2>
              <p className="text-xs text-slate-400">
                Inspect or update the active contract address
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status on Botchain RPC:</span>
              <span
                className={`font-semibold ${
                  isContractVerified ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {isContractVerified
                  ? "Verified Bytecode Deployed"
                  : contractAddress
                  ? "No Bytecode Found at Address"
                  : "Not Configured Yet"}
              </span>
            </div>
            <div className="font-mono text-slate-300 break-all">
              {contractAddress || "No contract address configured"}
            </div>
          </div>

          <form onSubmit={handleSaveContractAddress} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Set Deployed Contract Address (Optional Override)
            </label>
            <input
              type="text"
              value={customAddrInput}
              onChange={(e) => setCustomAddrInput(e.target.value)}
              placeholder="0x..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none text-xs font-mono text-white"
            />
            {configErr && <p className="text-xs text-rose-400">{configErr}</p>}
            {configMsg && <p className="text-xs text-emerald-400">{configMsg}</p>}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-all"
            >
              Save &amp; Verify Contract Address
            </button>
          </form>
        </div>
      </div>

      {/* Gas Optimization & Security Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 w-fit">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Gas-Optimized Solidity</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Single-contract architecture with zero external dependencies, custom Solidity errors,
            bounded UTF-8 string limits, O(1) mapping lookups, and zero unbounded loops.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 w-fit">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Self-Sovereign Security</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Only the cryptographic owner of a wallet address (`msg.sender`) can create or update
            their profile. All URLs are sanitized and all inputs are validated before display.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">100% Browser-Native Utilities</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            QR codes and RFC-compliant vCard 3.0 (`.vcf`) contact files are generated locally in
            your browser without any centralized backend, paid API, or subscription service.
          </p>
        </div>
      </div>

      {/* Public Blockchain Notice */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs sm:text-sm text-slate-300">
        <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Public Blockchain Transparency Notice: </span>
          All contact card fields saved to <code className="font-mono">BotCardRegistry</code> on
          Botchain Testnet are stored on a public blockchain and can be read by anyone. Never put
          private keys, seed phrases, or confidential secrets in your profile fields.
        </div>
      </div>
    </div>
  );
};


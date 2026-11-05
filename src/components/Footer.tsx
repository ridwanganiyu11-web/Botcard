import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTCHAIN_RPC_URL,
} from "../utils/network";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#050811] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">BotCard</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Decentralized personal and business contact cards anchored directly on Botchain
              Testnet. Self-sovereign identity with zero subscriptions, zero centralized servers,
              and instant QR &amp; vCard (.vcf) portability.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% On-Chain Public Registry • Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-violet-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-violet-300 transition-colors">
                  Create Card
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-violet-300 transition-colors">
                  Explore Profiles
                </Link>
              </li>
              <li>
                <Link to="/my-profile" className="hover:text-violet-300 transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-violet-300 transition-colors">
                  About &amp; Security
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Botchain Network
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li>Chain ID: {BOTCHAIN_CHAIN_ID}</li>
              <li>Token: BOT (150M Supply)</li>
              <li className="truncate" title={BOTCHAIN_RPC_URL}>
                RPC: {BOTCHAIN_RPC_URL}
              </li>
              <li>
                <a
                  href={BOTCHAIN_EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-sans"
                >
                  <span>Block Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BotCard DApp. Built for Botchain Testnet.</p>
          <p>All profile data stored on-chain is public and verifiable by design.</p>
        </div>
      </div>
    </footer>
  );
};


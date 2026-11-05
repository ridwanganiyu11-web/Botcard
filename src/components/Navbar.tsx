import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  CreditCard,
  Menu,
  X,
  Home,
  PlusCircle,
  Compass,
  UserCheck,
  Info,
  AlertTriangle,
} from "lucide-react";
import { WalletState } from "../hooks/useWallet";
import { WalletConnect } from "./WalletConnect";
import { BOTCHAIN_CHAIN_ID } from "../utils/network";

interface NavbarProps {
  wallet: WalletState;
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/create", label: "Create Card", icon: PlusCircle },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/my-profile", label: "My Profile", icon: UserCheck },
  { to: "/about", label: "About", icon: Info },
];

export const Navbar: React.FC<NavbarProps> = ({ wallet }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#060913]/85 backdrop-blur-xl">
      {wallet.isConnected && !wallet.isCorrectChain && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-amber-200">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Your wallet is connected to Chain ID {wallet.chainId ?? "Unknown"}. BotCard requires
              Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}).
            </span>
            <button
              type="button"
              onClick={wallet.switchToBotchain}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Switch / Add Botchain Testnet
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-blue-300 bg-clip-text text-transparent">
              BotCard
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-violet-400/90">
              Botchain Identity
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800/80">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/90 to-blue-600/90 text-white shadow-md shadow-violet-600/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WalletConnect wallet={wallet} />

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 pt-3 pb-5 space-y-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};


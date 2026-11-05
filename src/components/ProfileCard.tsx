import React, { useState } from "react";
import {
  User,
  Building2,
  Mail,
  Globe,
  MapPin,
  AtSign,
  ShieldCheck,
  Copy,
  Check,
  Download,
  QrCode as QrIcon,
  Share2,
  Edit3,
  ExternalLink,
} from "lucide-react";
import {
  PROFILE_BUSINESS,
  ProfileData,
  formatSocialUrl,
  sanitizeUrl,
} from "../utils/validation";
import { getExplorerAddressUrl, shortenAddress } from "../utils/network";
import { downloadVCardFile } from "../utils/vcard";
import { getPublicProfileUrl } from "../utils/qr";

interface ProfileCardProps {
  profile: ProfileData;
  walletAddress?: string;
  isPreview?: boolean;
  isVerifiedOnChain?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onShowQr?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  walletAddress,
  isPreview = false,
  isVerifiedOnChain = false,
  showActions = false,
  onEdit,
  onShowQr,
}) => {
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isBusiness = profile.profileType === PROFILE_BUSINESS;
  const resolvedWallet = walletAddress || profile.walletAddress || "";
  const safeWebsite = sanitizeUrl(profile.website);
  const safeSocialUrl = formatSocialUrl(profile.socialHandle);

  const displayName =
    profile.name?.trim() || (isBusiness ? "Your Business Name" : "Your Full Name");
  const displayHeadline =
    profile.headline?.trim() ||
    (isBusiness ? "Web3 Organization / Category" : "Professional Headline");
  const displayBio =
    profile.bio?.trim() ||
    (isPreview
      ? "Your biography or organization overview will appear here on your decentralized BotCard."
      : "No biography provided.");

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const handleCopyWallet = async () => {
    if (!resolvedWallet || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(resolvedWallet);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShareProfile = async () => {
    if (!resolvedWallet) return;
    const publicUrl = getPublicProfileUrl(resolvedWallet);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} — BotCard`,
          text: `Connect with ${displayName} on BotCard (Botchain Testnet):`,
          url: publicUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  };

  const handleDownloadVcf = () => {
    const publicUrl = resolvedWallet ? getPublicProfileUrl(resolvedWallet) : undefined;
    downloadVCardFile(profile, resolvedWallet, publicUrl);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel border border-slate-700/80 shadow-2xl">
      {/* Top Accent Banner */}
      <div
        className={`h-28 w-full bg-gradient-to-r ${
          isBusiness
            ? "from-blue-600/80 via-cyan-600/70 to-indigo-700/80"
            : "from-violet-600/80 via-purple-600/70 to-blue-600/80"
        } relative`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />

        {/* Category Badge & Verification Badge */}
        <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
              isBusiness
                ? "bg-blue-950/75 text-cyan-200 border-cyan-400/40"
                : "bg-violet-950/75 text-violet-200 border-violet-400/40"
            }`}
          >
            {isBusiness ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Business Card</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Personal Card</span>
              </>
            )}
          </span>

          {isVerifiedOnChain && profile.exists && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/85 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified on Botchain</span>
            </span>
          )}

          {isPreview && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-950/75 text-slate-300 border border-slate-700">
              Live Preview
            </span>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="px-6 sm:px-8 pb-8 -mt-12 relative">
        {/* Avatar / Monogram */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-xl border-4 border-[#0B1021] ${
              isBusiness
                ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                : "bg-gradient-to-br from-violet-500 to-indigo-600"
            }`}
          >
            {initials || (isBusiness ? "BC" : "ID")}
          </div>

          {resolvedWallet && (
            <div className="flex items-center gap-2 self-start sm:self-end bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-xs text-slate-300" title={resolvedWallet}>
                {shortenAddress(resolvedWallet, 6)}
              </span>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy Wallet Address"
              >
                {copiedWallet ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={getExplorerAddressUrl(resolvedWallet)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-violet-300 transition-colors"
                title="View Wallet on Botchain Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Identity Header */}
        <div className="space-y-1.5 mb-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
            {displayName}
          </h2>
          <p
            className={`text-sm sm:text-base font-medium ${
              isBusiness ? "text-cyan-300" : "text-violet-300"
            }`}
          >
            {displayHeadline}
          </p>
        </div>

        {/* Bio */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 whitespace-pre-line break-words bg-slate-950/45 p-4 rounded-2xl border border-slate-800/70">
          {displayBio}
        </p>

        {/* Contact Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {profile.email?.trim() && (
            <a
              href={`mailto:${encodeURIComponent(profile.email.trim())}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400 group-hover:bg-violet-500/25">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                  {isBusiness ? "Business Email" : "Email"}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-200 truncate block">
                  {profile.email.trim()}
                </span>
              </div>
            </a>
          )}

          {profile.website?.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors group">
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/25">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                  {isBusiness ? "Business Website" : "Website"}
                </span>
                {safeWebsite ? (
                  <a
                    href={safeWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-medium text-blue-300 hover:underline truncate block"
                  >
                    {profile.website.trim()}
                  </a>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-slate-300 truncate block">
                    {profile.website.trim()}
                  </span>
                )}
              </div>
            </div>
          )}

          {profile.socialHandle?.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors group">
              <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25">
                <AtSign className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                  Social Handle
                </span>
                {safeSocialUrl ? (
                  <a
                    href={safeSocialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-medium text-cyan-300 hover:underline truncate block"
                  >
                    {profile.socialHandle.trim()}
                  </a>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-slate-200 truncate block">
                    {profile.socialHandle.trim()}
                  </span>
                )}
              </div>
            </div>
          )}

          {profile.location?.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                  {isBusiness ? "Business Location" : "Location"}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-200 truncate block">
                  {profile.location.trim()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Full Wallet Address Footer Row */}
        {resolvedWallet && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                Botchain Wallet Address
              </span>
              <span className="font-mono text-slate-200 break-all">{resolvedWallet}</span>
            </div>
            <span
              className={`self-start sm:self-center shrink-0 px-2.5 py-1 rounded-lg font-medium ${
                profile.exists
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {profile.exists ? "Registered on Botchain" : "Unregistered Preview"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-md transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadVcf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-violet-400" />
              <span>Download Contact (.vcf)</span>
            </button>

            {onShowQr && (
              <button
                type="button"
                onClick={onShowQr}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all"
              >
                <QrIcon className="w-4 h-4 text-blue-400" />
                <span>Generate QR Code</span>
              </button>
            )}

            {resolvedWallet && (
              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Profile Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Share Profile</span>
                  </>
                )}
              </button>
            )}

            {resolvedWallet && (
              <button
                type="button"
                onClick={handleCopyWallet}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all"
              >
                {copiedWallet ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Wallet!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Wallet Address</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useEffect, useState } from "react";
import {
  QrCode as QrIcon,
  Download,
  Copy,
  Check,
  Share2,
  X,
} from "lucide-react";
import {
  downloadQrCodePng,
  generateProfileQrDataUrl,
  getPublicProfileUrl,
} from "../utils/qr";
import { shortenAddress } from "../utils/network";

interface QRCodeProps {
  walletAddress: string;
  profileName?: string;
  onClose?: () => void;
  inline?: boolean;
}

export const QRCode: React.FC<QRCodeProps> = ({
  walletAddress,
  profileName,
  onClose,
  inline = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publicUrl = getPublicProfileUrl(walletAddress);

  useEffect(() => {
    let active = true;
    generateProfileQrDataUrl(publicUrl, 320)
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to generate QR code");
        }
      });
    return () => {
      active = false;
    };
  }, [publicUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareMsg("Could not copy automatically. Please copy the link manually.");
    }
  };

  const handleNativeShare = async () => {
    setShareMsg(null);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profileName || "BotCard"} — Decentralized Contact Card`,
          text: `View ${profileName || shortenAddress(walletAddress)}'s verified Web3 contact card on BotCard:`,
          url: publicUrl,
        });
        return;
      } catch {
        // User cancelled or share failed; fallback to copy
      }
    }
    await handleCopyUrl();
    setShareMsg("Profile link copied to clipboard!");
    setTimeout(() => setShareMsg(null), 2500);
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const slug = (profileName || shortenAddress(walletAddress))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    downloadQrCodePng(dataUrl, `botcard-${slug}-qr.png`);
  };

  const content = (
    <div className="glass-panel rounded-2xl p-6 border border-slate-700/80 max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400">
            <QrIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {profileName ? `${profileName}'s QR Code` : "Profile QR Code"}
            </h3>
            <p className="text-xs text-slate-400">Scan to open verified BotCard profile</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close QR Modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner mb-4">
        {error ? (
          <p className="text-xs text-rose-600 py-10">{error}</p>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code for ${walletAddress}`}
            className="w-56 h-56 object-contain"
          />
        ) : (
          <div className="w-56 h-56 flex items-center justify-center text-slate-500 text-xs">
            Generating QR Code...
          </div>
        )}
      </div>

      <div className="mb-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-300 truncate">{publicUrl}</span>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {shareMsg && (
        <p className="text-xs text-center text-emerald-300 mb-3">{shareMsg}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={!dataUrl}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-md transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Link</span>
        </button>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      {content}
    </div>
  );
};


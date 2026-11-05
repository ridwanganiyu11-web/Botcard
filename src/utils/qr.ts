import QRCode from "qrcode";

export function getPublicProfileUrl(walletAddress: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://botcard.local");
  return `${base.replace(/\/+$/, "")}/profile/${walletAddress}`;
}

export async function generateProfileQrDataUrl(
  url: string,
  size = 320
): Promise<string> {
  if (!url || !url.trim()) {
    throw new Error("URL is required to generate a QR code.");
  }
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0B1021",
      light: "#FFFFFF",
    },
  });
}

export function downloadQrCodePng(dataUrl: string, filename = "botcard-qr.png"): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


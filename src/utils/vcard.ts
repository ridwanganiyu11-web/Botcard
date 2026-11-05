import {
  PROFILE_BUSINESS,
  ProfileData,
  formatSocialUrl,
  sanitizeUrl,
} from "./validation";

export function escapeVCardValue(value: string): string {
  if (!value) return "";
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function buildVCardContent(
  profile: ProfileData,
  walletAddress?: string,
  publicProfileUrl?: string
): string {
  const isBusiness = profile.profileType === PROFILE_BUSINESS;
  const fullName = (profile.name || "BotCard Contact").trim();
  const escapedName = escapeVCardValue(fullName);

  // Split name into Family;Given for N field on personal cards, or keep full for business
  let structuredName = `;${escapedName};;;`;
  if (!isBusiness) {
    const parts = fullName.split(/\s+/);
    if (parts.length > 1) {
      const lastName = escapeVCardValue(parts[parts.length - 1]);
      const firstName = escapeVCardValue(parts.slice(0, -1).join(" "));
      structuredName = `${lastName};${firstName};;;`;
    } else {
      structuredName = `;${escapedName};;;`;
    }
  }

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapedName}`,
    `N:${structuredName}`,
  ];

  if (isBusiness) {
    lines.push(`ORG:${escapedName}`);
    if (profile.headline?.trim()) {
      lines.push(`TITLE:${escapeVCardValue(profile.headline.trim())}`);
    }
  } else {
    if (profile.headline?.trim()) {
      lines.push(`TITLE:${escapeVCardValue(profile.headline.trim())}`);
    }
  }

  if (profile.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(profile.email.trim())}`);
  }

  const safeWebsite = sanitizeUrl(profile.website);
  if (safeWebsite) {
    lines.push(`URL:${escapeVCardValue(safeWebsite)}`);
  }

  if (publicProfileUrl) {
    lines.push(`URL;TYPE=BotCard:${escapeVCardValue(publicProfileUrl)}`);
  }

  const socialUrl = formatSocialUrl(profile.socialHandle);
  if (socialUrl) {
    lines.push(`X-SOCIALPROFILE;TYPE=social:${escapeVCardValue(socialUrl)}`);
  }

  if (profile.location?.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(profile.location.trim())};;;;`);
  }

  const noteParts: string[] = [];
  if (profile.bio?.trim()) {
    noteParts.push(profile.bio.trim());
  }
  if (profile.socialHandle?.trim()) {
    noteParts.push(`Social: ${profile.socialHandle.trim()}`);
  }
  const addr = walletAddress || profile.walletAddress;
  if (addr) {
    noteParts.push(`Botchain Wallet: ${addr}`);
  }
  if (noteParts.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(noteParts.join("\n"))}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCardFile(
  profile: ProfileData,
  walletAddress?: string,
  publicProfileUrl?: string
): string {
  const vcfContent = buildVCardContent(profile, walletAddress, publicProfileUrl);

  if (typeof window !== "undefined" && typeof Blob !== "undefined") {
    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slug = (profile.name || "botcard-contact")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `${slug || "contact"}.vcf`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return vcfContent;
}


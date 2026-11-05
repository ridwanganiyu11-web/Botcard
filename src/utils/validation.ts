import { isAddress, getAddress } from "ethers";

export const PROFILE_PERSONAL = 0;
export const PROFILE_BUSINESS = 1;
export type ProfileCategory = 0 | 1;

export const FIELD_LIMITS = {
  name: 80,
  headline: 120,
  bio: 500,
  email: 120,
  website: 160,
  socialHandle: 80,
  location: 100,
} as const;

export interface ProfileFormData {
  name: string;
  headline: string;
  bio: string;
  email: string;
  website: string;
  socialHandle: string;
  location: string;
  profileType: ProfileCategory;
}

export interface ProfileData extends ProfileFormData {
  exists: boolean;
  walletAddress?: string;
}

export interface ValidationErrors {
  name?: string;
  headline?: string;
  bio?: string;
  email?: string;
  website?: string;
  socialHandle?: string;
  location?: string;
  profileType?: string;
}

export function getUtf8ByteLength(str: string): number {
  return new TextEncoder().encode(str || "").length;
}

export function isValidWalletAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  return isAddress(address.trim());
}

export function normalizeWalletAddress(address: string): string | null {
  try {
    if (!isValidWalletAddress(address)) return null;
    return getAddress(address.trim());
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  if (!email) return true; // Optional unless provided
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Sanitizes a user-provided URL so only safe http:// or https:// URLs are clickable.
 * Rejects javascript:, data:, vbscript:, file:, etc.
 */
export function sanitizeUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function formatSocialUrl(handle: string): string | null {
  if (!handle || !handle.trim()) return null;
  const trimmed = handle.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return sanitizeUrl(trimmed);
  }
  const cleanHandle = trimmed.replace(/^@+/, "").replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!cleanHandle) return null;
  return `https://x.com/${encodeURIComponent(cleanHandle)}`;
}

export function validateProfileForm(data: ProfileFormData): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  const nameTrimmed = (data.name || "").trim();
  const nameBytes = getUtf8ByteLength(nameTrimmed);
  if (!nameTrimmed) {
    errors.name =
      data.profileType === PROFILE_BUSINESS
        ? "Business name is required."
        : "Full name is required.";
  } else if (nameBytes > FIELD_LIMITS.name) {
    errors.name = `Name must be ${FIELD_LIMITS.name} bytes or fewer (currently ${nameBytes}).`;
  }

  const headlineBytes = getUtf8ByteLength((data.headline || "").trim());
  if (headlineBytes > FIELD_LIMITS.headline) {
    errors.headline = `Headline must be ${FIELD_LIMITS.headline} bytes or fewer.`;
  }

  const bioBytes = getUtf8ByteLength((data.bio || "").trim());
  if (bioBytes > FIELD_LIMITS.bio) {
    errors.bio = `Biography must be ${FIELD_LIMITS.bio} bytes or fewer.`;
  }

  const emailTrimmed = (data.email || "").trim();
  const emailBytes = getUtf8ByteLength(emailTrimmed);
  if (emailBytes > FIELD_LIMITS.email) {
    errors.email = `Email must be ${FIELD_LIMITS.email} bytes or fewer.`;
  } else if (emailTrimmed && !isValidEmail(emailTrimmed)) {
    errors.email = "Please enter a valid email address.";
  }

  const websiteTrimmed = (data.website || "").trim();
  const websiteBytes = getUtf8ByteLength(websiteTrimmed);
  if (websiteBytes > FIELD_LIMITS.website) {
    errors.website = `Website must be ${FIELD_LIMITS.website} bytes or fewer.`;
  } else if (websiteTrimmed && !sanitizeUrl(websiteTrimmed)) {
    errors.website = "Please enter a valid http:// or https:// website URL.";
  }

  const socialBytes = getUtf8ByteLength((data.socialHandle || "").trim());
  if (socialBytes > FIELD_LIMITS.socialHandle) {
    errors.socialHandle = `Social handle must be ${FIELD_LIMITS.socialHandle} bytes or fewer.`;
  }

  const locationBytes = getUtf8ByteLength((data.location || "").trim());
  if (locationBytes > FIELD_LIMITS.location) {
    errors.location = `Location must be ${FIELD_LIMITS.location} bytes or fewer.`;
  }

  if (data.profileType !== PROFILE_PERSONAL && data.profileType !== PROFILE_BUSINESS) {
    errors.profileType = "Profile category must be Personal (0) or Business (1).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}


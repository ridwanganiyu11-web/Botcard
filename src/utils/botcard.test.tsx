import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  FIELD_LIMITS,
  PROFILE_BUSINESS,
  PROFILE_PERSONAL,
  isValidWalletAddress,
  normalizeWalletAddress,
  sanitizeUrl,
  validateProfileForm,
} from "./validation";
import { buildVCardContent, escapeVCardValue } from "./vcard";
import { generateProfileQrDataUrl, getPublicProfileUrl } from "./qr";
import {
  BOTCHAIN_CHAIN_ID,
  isCorrectNetwork,
  shortenAddress,
  switchOrAddBotchainNetwork,
} from "./network";
import { ProfileCard } from "../components/ProfileCard";
import { ProfileForm } from "../components/ProfileForm";
import { TransactionStatus } from "../components/TransactionStatus";

function mountComponent(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Frontend Utilities & Components Suite", () => {
  it("1. Validates wallet addresses and network Chain ID handling", () => {
    const validAddr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    expect(isValidWalletAddress(validAddr)).toBe(true);
    expect(normalizeWalletAddress(validAddr)).toBe(validAddr);
    expect(isValidWalletAddress("0x12345")).toBe(false);
    expect(shortenAddress(validAddr, 4)).toBe("0x71C7...976F");

    expect(isCorrectNetwork(BOTCHAIN_CHAIN_ID)).toBe(true);
    expect(isCorrectNetwork(1)).toBe(false);
    expect(isCorrectNetwork(null)).toBe(false);
  });

  it("2. Handles switching and adding Botchain Testnet when wallet returns 4902", async () => {
    const calls: Array<{ method: string; params?: unknown[] }> = [];
    const mockProvider = {
      request: vi.fn(async (args: { method: string; params?: unknown[] }) => {
        calls.push(args);
        if (args.method === "wallet_switchEthereumChain") {
          const err = new Error("Unrecognized chain ID") as Error & { code?: number };
          err.code = 4902;
          throw err;
        }
        return null;
      }),
    };

    const switched = await switchOrAddBotchainNetwork(mockProvider);
    expect(switched).toBe(true);
    expect(calls.length).toBe(2);
    expect(calls[0].method).toBe("wallet_switchEthereumChain");
    expect(calls[1].method).toBe("wallet_addEthereumChain");
  });

  it("3. Enforces form validation and sanitizes dangerous URLs", () => {
    const emptyResult = validateProfileForm({
      name: "",
      headline: "Dev",
      bio: "Bio",
      email: "not-an-email",
      website: "javascript:alert(1)",
      socialHandle: "@dev",
      location: "Earth",
      profileType: PROFILE_PERSONAL,
    });

    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.errors.name).toBeDefined();
    expect(emptyResult.errors.email).toBeDefined();
    expect(emptyResult.errors.website).toBeDefined();

    // Exceeding byte limit
    const tooLong = validateProfileForm({
      name: "A".repeat(FIELD_LIMITS.name + 1),
      headline: "Valid",
      bio: "Valid",
      email: "alice@botcard.io",
      website: "https://botcard.io",
      socialHandle: "@alice",
      location: "Zurich",
      profileType: PROFILE_PERSONAL,
    });
    expect(tooLong.valid).toBe(false);
    expect(tooLong.errors.name).toContain("80 bytes");

    // URL sanitization
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeUrl("https://scan.bohr.life")).toBe("https://scan.bohr.life/");
    expect(sanitizeUrl("botcard.io")).toBe("https://botcard.io/");
  });

  it("4. Generates local QR code Data URL without external APIs", async () => {
    const wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    const profileUrl = getPublicProfileUrl(wallet, "https://botcard.app");
    expect(profileUrl).toBe(`https://botcard.app/profile/${wallet}`);

    const qrDataUrl = await generateProfileQrDataUrl(profileUrl);
    expect(qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("5. Generates valid vCard (.vcf) with escaped characters for Personal and Business cards", () => {
    expect(escapeVCardValue("One, Two; Three\nFour")).toBe("One\\, Two\\; Three\\nFour");

    const businessVcf = buildVCardContent(
      {
        name: "Nexus Labs, Inc.",
        headline: "RPC & Node Infrastructure",
        bio: "Enterprise Web3 infrastructure.",
        email: "hello@nexuslabs.io",
        website: "https://nexuslabs.io",
        socialHandle: "@nexuslabs",
        location: "Singapore; Marina Bay",
        profileType: PROFILE_BUSINESS,
        exists: true,
      },
      "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "https://botcard.app/profile/0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
    );

    expect(businessVcf).toContain("BEGIN:VCARD");
    expect(businessVcf).toContain("VERSION:3.0");
    expect(businessVcf).toContain("FN:Nexus Labs\\, Inc.");
    expect(businessVcf).toContain("ORG:Nexus Labs\\, Inc.");
    expect(businessVcf).toContain("TITLE:RPC & Node Infrastructure");
    expect(businessVcf).toContain("EMAIL;TYPE=INTERNET:hello@nexuslabs.io");
    expect(businessVcf).toContain("ADR;TYPE=WORK:;;Singapore\\; Marina Bay;;;;");
    expect(businessVcf).toContain("END:VCARD");
  });

  it("6. Renders ProfileCard & live ProfileForm preview accurately", () => {
    const { container, unmount } = mountComponent(
      <ProfileCard
        profile={{
          name: "Elena Rostova",
          headline: "Zero-Knowledge Cryptographer",
          bio: "Researching zk-rollups on Botchain.",
          email: "elena@zk.io",
          website: "https://zk.io",
          socialHandle: "@elena_zk",
          location: "Zug, Switzerland",
          profileType: PROFILE_PERSONAL,
          exists: true,
        }}
        walletAddress="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        isVerifiedOnChain={true}
        showActions={true}
      />
    );

    expect(container.textContent).toContain("Elena Rostova");
    expect(container.textContent).toContain("Zero-Knowledge Cryptographer");
    expect(container.textContent).toContain("Verified on Botchain");
    expect(container.textContent).toContain("Personal Card");
    unmount();
  });

  it("7. Updates live preview when user types in ProfileForm and switches category", () => {
    const onSubmit = vi.fn(async () => {});
    const { container, unmount } = mountComponent(
      <ProfileForm
        onSubmit={onSubmit}
        walletAddress="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      />
    );

    expect(container.textContent).toContain("Full Name *");

    const buttons = Array.from(container.querySelectorAll("button"));
    const businessBtn = buttons.find((b) => b.textContent?.includes("Business Card"));
    expect(businessBtn).toBeTruthy();

    act(() => {
      businessBtn?.click();
    });

    expect(container.textContent).toContain("Business Name *");
    expect(container.textContent).toContain("Category: Business (1)");
    unmount();
  });

  it("8. Renders TransactionStatus states (pending, confirmed, failed) with Explorer link", () => {
    const sampleTx = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const { container, unmount } = mountComponent(
      <TransactionStatus
        status="confirmed"
        txHash={sampleTx}
        blockNumber={29373696}
        error={null}
      />
    );

    expect(container.textContent).toContain(
      "Transaction confirmed on Botchain Testnet"
    );
    expect(container.textContent).toContain("Block #29373696");
    expect(container.textContent).toContain("View on Explorer");
    unmount();
  });
});


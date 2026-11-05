import { defineChain } from "viem";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const BOTCHAIN_CHAIN_ID = Number(env.VITE_CHAIN_ID || 968);
export const BOTCHAIN_CHAIN_HEX = `0x${BOTCHAIN_CHAIN_ID.toString(16)}`;
export const BOTCHAIN_RPC_URL = env.VITE_RPC_URL || "https://rpc.bohr.life";
export const BOTCHAIN_EXPLORER_URL = (env.VITE_EXPLORER_URL || "https://scan.bohr.life").replace(
  /\/+$/,
  ""
);
export const REOWN_PROJECT_ID =
  env.VITE_REOWN_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

export const BOTCHAIN_NETWORK_INFO = {
  chainId: BOTCHAIN_CHAIN_ID,
  chainIdHex: BOTCHAIN_CHAIN_HEX,
  chainName: "Botchain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: [BOTCHAIN_RPC_URL],
  blockExplorerUrls: [`${BOTCHAIN_EXPLORER_URL}/`],
  totalSupply: "150,000,000 BOT",
};

export const botchainTestnet = defineChain({
  id: BOTCHAIN_CHAIN_ID,
  name: "Botchain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [BOTCHAIN_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Botchain Explorer",
      url: BOTCHAIN_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [botchainTestnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: REOWN_PROJECT_ID,
  ssr: false,
});

let appKitInitialized = false;

export function initAppKit(): void {
  if (appKitInitialized || typeof window === "undefined") return;
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      defaultNetwork: botchainTestnet,
      projectId: REOWN_PROJECT_ID,
      metadata: {
        name: "BotCard",
        description: "Decentralized Web3 Contact Cards on Botchain Testnet",
        url: window.location.origin,
        icons: ["https://avatars.githubusercontent.com/u/179229932"],
      },
      features: {
        analytics: false,
      },
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#8B5CF6",
        "--w3m-border-radius-master": "2px",
      },
    });
    appKitInitialized = true;
  } catch (err) {
    console.warn("AppKit initialization warning:", err);
  }
}

export function isCorrectNetwork(chainId: number | null | undefined): boolean {
  if (!chainId) return false;
  return Number(chainId) === BOTCHAIN_CHAIN_ID;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getExplorerTxUrl(txHash: string): string {
  return `${BOTCHAIN_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${BOTCHAIN_EXPLORER_URL}/address/${address}`;
}

export function getExplorerBlockUrl(blockNumber: number | bigint): string {
  return `${BOTCHAIN_EXPLORER_URL}/block/${blockNumber.toString()}`;
}

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export async function switchOrAddBotchainNetwork(
  provider?: Eip1193Provider
): Promise<boolean> {
  const eth =
    provider ||
    ((typeof window !== "undefined" &&
      (window as unknown as { ethereum?: Eip1193Provider }).ethereum) ||
      undefined);

  if (!eth) {
    throw new Error("No Web3 wallet provider detected in browser.");
  }

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BOTCHAIN_CHAIN_HEX }],
    });
    return true;
  } catch (switchError: unknown) {
    const err = switchError as { code?: number; message?: string };
    // Error code 4902 or unrecognized chain means we should add Botchain Testnet
    if (
      err?.code === 4902 ||
      err?.code === -32603 ||
      (err?.message && err.message.toLowerCase().includes("unrecognized"))
    ) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BOTCHAIN_CHAIN_HEX,
            chainName: BOTCHAIN_NETWORK_INFO.chainName,
            nativeCurrency: BOTCHAIN_NETWORK_INFO.nativeCurrency,
            rpcUrls: BOTCHAIN_NETWORK_INFO.rpcUrls,
            blockExplorerUrls: BOTCHAIN_NETWORK_INFO.blockExplorerUrls,
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}


import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Eip1193Provider,
  EventLog,
} from "ethers";
import registryArtifact from "../abi/BotCardRegistry.json";
import { BOTCHAIN_CHAIN_ID, BOTCHAIN_RPC_URL } from "./network";
import {
  ProfileCategory,
  ProfileData,
  ProfileFormData,
  isValidWalletAddress,
  normalizeWalletAddress,
} from "./validation";

const STORAGE_CONTRACT_KEY = "botcard_custom_contract_address";
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export interface OnChainActivityEvent {
  txHash: string;
  blockNumber: number;
  wallet: string;
  profileType: ProfileCategory;
}

export function getConfiguredContractAddress(): string {
  // 1. Check user-configured override in localStorage (non-sensitive public contract address)
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(STORAGE_CONTRACT_KEY);
    if (stored && isValidWalletAddress(stored)) {
      return normalizeWalletAddress(stored) || "";
    }
  }

  // 2. Check VITE_CONTRACT_ADDRESS environment variable
  const envAddress = env.VITE_CONTRACT_ADDRESS || "";
  if (envAddress && isValidWalletAddress(envAddress)) {
    return normalizeWalletAddress(envAddress) || "";
  }

  // 3. Check src/abi/BotCardRegistry.json (populated automatically by scripts/deploy.ts)
  const artifactAddress = (registryArtifact as { address?: string }).address || "";
  if (artifactAddress && isValidWalletAddress(artifactAddress)) {
    return normalizeWalletAddress(artifactAddress) || "";
  }

  return "";
}

export function setCustomContractAddress(address: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const trimmed = address.trim();
  if (!trimmed) {
    window.localStorage.removeItem(STORAGE_CONTRACT_KEY);
    return;
  }
  const normalized = normalizeWalletAddress(trimmed);
  if (!normalized) {
    throw new Error("Invalid Ethereum/Botchain contract address.");
  }
  window.localStorage.setItem(STORAGE_CONTRACT_KEY, normalized);
}

let cachedReadProvider: JsonRpcProvider | null = null;

export function getReadProvider(): JsonRpcProvider {
  if (!cachedReadProvider) {
    cachedReadProvider = new JsonRpcProvider(BOTCHAIN_RPC_URL, BOTCHAIN_CHAIN_ID, {
      staticNetwork: true,
    });
  }
  return cachedReadProvider;
}

export function getReadContract(customAddress?: string): Contract {
  const address = customAddress || getConfiguredContractAddress();
  if (!address || !isValidWalletAddress(address)) {
    throw new Error(
      "BotCardRegistry contract address is not configured yet. Deploy the contract to Botchain Testnet first or set VITE_CONTRACT_ADDRESS."
    );
  }
  return new Contract(address, registryArtifact.abi, getReadProvider());
}

export async function getWriteContract(
  eip1193Provider?: Eip1193Provider,
  customAddress?: string
): Promise<{ contract: Contract; signerAddress: string; provider: BrowserProvider }> {
  const address = customAddress || getConfiguredContractAddress();
  if (!address || !isValidWalletAddress(address)) {
    throw new Error(
      "BotCardRegistry contract address is not configured yet. Please deploy BotCardRegistry to Botchain Testnet first."
    );
  }

  const injected =
    eip1193Provider ||
    ((typeof window !== "undefined" &&
      (window as unknown as { ethereum?: Eip1193Provider }).ethereum) ||
      undefined);

  if (!injected) {
    throw new Error("No Web3 wallet provider found. Please connect MetaMask or a Web3 wallet.");
  }

  const browserProvider = new BrowserProvider(injected);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== BOTCHAIN_CHAIN_ID) {
    throw new Error(
      `Wrong network detected (Chain ID ${network.chainId.toString()}). Please switch your wallet to Botchain Testnet (Chain ID ${BOTCHAIN_CHAIN_ID}).`
    );
  }

  const signer = await browserProvider.getSigner();
  const signerAddress = await signer.getAddress();
  const contract = new Contract(address, registryArtifact.abi, signer);

  return { contract, signerAddress, provider: browserProvider };
}

export async function verifyContractDeployed(customAddress?: string): Promise<boolean> {
  try {
    const address = customAddress || getConfiguredContractAddress();
    if (!address || !isValidWalletAddress(address)) return false;
    const code = await getReadProvider().getCode(address);
    return Boolean(code && code !== "0x" && code !== "0x0");
  } catch {
    return false;
  }
}

export async function fetchProfileFromChain(walletAddress: string): Promise<ProfileData> {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) {
    throw new Error("Invalid wallet address format.");
  }

  const contract = getReadContract();
  const raw = await contract.getProfile(normalized);

  return {
    name: String(raw.name || ""),
    headline: String(raw.headline || ""),
    bio: String(raw.bio || ""),
    email: String(raw.email || ""),
    website: String(raw.website || ""),
    socialHandle: String(raw.socialHandle || ""),
    location: String(raw.location || ""),
    profileType: (Number(raw.profileType) === 1 ? 1 : 0) as ProfileCategory,
    exists: Boolean(raw.exists),
    walletAddress: normalized,
  };
}

export async function checkHasProfileOnChain(walletAddress: string): Promise<boolean> {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) return false;
  const contract = getReadContract();
  return Boolean(await contract.hasProfile(normalized));
}

export async function fetchTotalProfilesOnChain(): Promise<number | null> {
  try {
    const isDeployed = await verifyContractDeployed();
    if (!isDeployed) return null;
    const contract = getReadContract();
    const total = await contract.totalProfiles();
    return Number(total);
  } catch {
    return null;
  }
}

export async function fetchProfileEvents(
  filterWallet?: string,
  maxBlocksBack = 25000
): Promise<{ available: boolean; events: OnChainActivityEvent[]; reason?: string }> {
  try {
    const address = getConfiguredContractAddress();
    if (!address) {
      return {
        available: false,
        events: [],
        reason: "Contract address is not configured yet.",
      };
    }

    const isDeployed = await verifyContractDeployed(address);
    if (!isDeployed) {
      return {
        available: false,
        events: [],
        reason: "No contract bytecode found at the configured address on Botchain Testnet.",
      };
    }

    const provider = getReadProvider();
    const contract = getReadContract(address);
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - maxBlocksBack);

    const normalizedWallet = filterWallet ? normalizeWalletAddress(filterWallet) : null;
    const filter = normalizedWallet
      ? contract.filters.ProfileUpdated(normalizedWallet)
      : contract.filters.ProfileUpdated();

    const logs = await contract.queryFilter(filter, fromBlock, latestBlock);
    const parsed: OnChainActivityEvent[] = logs
      .filter((log): log is EventLog => "args" in log)
      .map((log) => ({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        wallet: String(log.args[0]),
        profileType: (Number(log.args[1]) === 1 ? 1 : 0) as ProfileCategory,
      }))
      .sort((a, b) => b.blockNumber - a.blockNumber);

    return { available: true, events: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "RPC log query not available";
    return {
      available: false,
      events: [],
      reason: `Event history could not be retrieved from RPC: ${msg}`,
    };
  }
}

export function formatContractError(error: unknown): string {
  if (!error) return "Unknown blockchain error occurred.";
  const errObj = error as {
    code?: string | number;
    reason?: string;
    shortMessage?: string;
    message?: string;
    data?: string;
  };

  if (
    errObj.code === "ACTION_REJECTED" ||
    errObj.code === 4001 ||
    errObj.message?.toLowerCase().includes("user rejected") ||
    errObj.message?.toLowerCase().includes("user denied")
  ) {
    return "Transaction was rejected in your wallet.";
  }

  const combined = `${errObj.reason || ""} ${errObj.shortMessage || ""} ${errObj.message || ""}`;

  if (combined.includes("ProfileAlreadyExists")) {
    return "This wallet already owns a registered BotCard profile. Please use Edit Profile instead.";
  }
  if (combined.includes("ProfileDoesNotExist")) {
    return "No existing BotCard profile found for this wallet. Please create a profile first.";
  }
  if (combined.includes("InvalidProfileType")) {
    return "Invalid profile category selected. Choose Personal (0) or Business (1).";
  }
  if (combined.includes("InvalidNameLength")) {
    return "Name is required and must be 80 bytes or fewer.";
  }
  if (combined.includes("StringTooLong")) {
    return "One or more fields exceed the maximum on-chain character limit.";
  }
  if (combined.includes("Unauthorized")) {
    return "Only the owner of this wallet is authorized to update this profile.";
  }
  if (combined.toLowerCase().includes("insufficient funds")) {
    return "Insufficient BOT balance in your wallet to pay for Botchain Testnet gas.";
  }

  return errObj.shortMessage || errObj.reason || errObj.message || "Transaction failed on-chain.";
}

export function sanitizeFormPayload(form: ProfileFormData): ProfileFormData {
  return {
    name: (form.name || "").trim(),
    headline: (form.headline || "").trim(),
    bio: (form.bio || "").trim(),
    email: (form.email || "").trim(),
    website: (form.website || "").trim(),
    socialHandle: (form.socialHandle || "").trim(),
    location: (form.location || "").trim(),
    profileType: form.profileType === 1 ? 1 : 0,
  };
}


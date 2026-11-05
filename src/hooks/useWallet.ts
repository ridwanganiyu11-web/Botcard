import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { BrowserProvider, Eip1193Provider, formatEther } from "ethers";
import {
  BOTCHAIN_CHAIN_ID,
  isCorrectNetwork,
  shortenAddress,
  switchOrAddBotchainNetwork,
} from "../utils/network";
import { normalizeWalletAddress } from "../utils/validation";

type InjectedEthereum = Eip1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getInjectedEthereum(): InjectedEthereum | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: InjectedEthereum }).ethereum;
}

const DISCONNECTED_FLAG_KEY = "botcard_wallet_disconnected";

export interface WalletState {
  address: string | null;
  shortAddress: string;
  chainId: number | null;
  isConnected: boolean;
  isCorrectChain: boolean;
  isConnecting: boolean;
  balanceBot: string | null;
  error: string | null;
  hasInjectedWallet: boolean;
  connectWallet: () => Promise<void>;
  openWalletModal: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToBotchain: () => Promise<boolean>;
  copyAddress: () => Promise<boolean>;
  getEip1193Provider: () => Promise<Eip1193Provider | undefined>;
}

export function useWallet(): WalletState {
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const wagmiChainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  let appKitOpen: (() => Promise<unknown>) | undefined;
  try {
    const appKit = useAppKit();
    appKitOpen = () => appKit.open();
  } catch {
    appKitOpen = undefined;
  }

  const [directAddress, setDirectAddress] = useState<string | null>(null);
  const [directChainId, setDirectChainId] = useState<number | null>(null);
  const [balanceBot, setBalanceBot] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInjectedWallet = Boolean(getInjectedEthereum());

  const activeAddress = wagmiConnected && wagmiAddress
    ? normalizeWalletAddress(wagmiAddress)
    : directAddress;

  const activeChainId = directChainId ?? (wagmiConnected ? wagmiChainId : null);
  const isConnected = Boolean(activeAddress);
  const isCorrectChain = isConnected && isCorrectNetwork(activeChainId);

  const getEip1193Provider = useCallback(async (): Promise<Eip1193Provider | undefined> => {
    if (connector && typeof connector.getProvider === "function") {
      try {
        const p = await connector.getProvider();
        if (p) return p as Eip1193Provider;
      } catch {
        // fallback to window.ethereum
      }
    }
    const eth = getInjectedEthereum();
    if (eth) {
      return eth;
    }
    return undefined;
  }, [connector]);

  const syncDirectProviderState = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (window.localStorage?.getItem(DISCONNECTED_FLAG_KEY) === "1") {
      return;
    }
    const eth = getInjectedEthereum();
    if (!eth) return;

    try {
      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      const chainHex = (await eth.request({ method: "eth_chainId" })) as string;
      const parsedChain = chainHex ? parseInt(chainHex, 16) : null;
      setDirectChainId(parsedChain);

      if (accounts && accounts.length > 0) {
        setDirectAddress(normalizeWalletAddress(accounts[0]));
      } else {
        setDirectAddress(null);
      }
    } catch {
      // Do not fail silently into fake state
    }
  }, []);

  useEffect(() => {
    syncDirectProviderState();

    if (typeof window === "undefined") return;
    const eth = getInjectedEthereum();
    if (!eth || !eth.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      if (list.length === 0) {
        setDirectAddress(null);
        setBalanceBot(null);
      } else {
        window.localStorage?.removeItem(DISCONNECTED_FLAG_KEY);
        setDirectAddress(normalizeWalletAddress(list[0]));
      }
    };

    const handleChainChanged = (chainHex: unknown) => {
      if (typeof chainHex === "string") {
        setDirectChainId(parseInt(chainHex, 16));
      } else if (typeof chainHex === "number") {
        setDirectChainId(chainHex);
      }
    };

    const handleDisconnect = () => {
      setDirectAddress(null);
      setBalanceBot(null);
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    eth.on("disconnect", handleDisconnect);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
      eth.removeListener?.("disconnect", handleDisconnect);
    };
  }, [syncDirectProviderState]);

  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!activeAddress) {
        setBalanceBot(null);
        return;
      }
      try {
        const providerObj = await getEip1193Provider();
        if (!providerObj) return;
        const browserProvider = new BrowserProvider(providerObj);
        const bal = await browserProvider.getBalance(activeAddress);
        if (!cancelled) {
          const formatted = Number(formatEther(bal)).toFixed(4);
          setBalanceBot(formatted);
        }
      } catch {
        if (!cancelled) setBalanceBot(null);
      }
    }
    loadBalance();
    return () => {
      cancelled = true;
    };
  }, [activeAddress, activeChainId, getEip1193Provider]);

  const connectWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem(DISCONNECTED_FLAG_KEY);
      }
      const eth = getInjectedEthereum();
      if (eth) {
        const accounts = (await eth.request({
          method: "eth_requestAccounts",
        })) as string[];
        const chainHex = (await eth.request({ method: "eth_chainId" })) as string;
        if (chainHex) {
          setDirectChainId(parseInt(chainHex, 16));
        }
        if (accounts && accounts.length > 0) {
          setDirectAddress(normalizeWalletAddress(accounts[0]));
        }
      } else if (appKitOpen) {
        await appKitOpen();
      } else {
        throw new Error(
          "MetaMask or a compatible Web3 wallet extension was not detected in your browser."
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect wallet.";
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [appKitOpen]);

  const openWalletModal = useCallback(async () => {
    setError(null);
    if (appKitOpen) {
      await appKitOpen();
    } else {
      await connectWallet();
    }
  }, [appKitOpen, connectWallet]);

  const disconnectWallet = useCallback(async () => {
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage?.setItem(DISCONNECTED_FLAG_KEY, "1");
    }
    setDirectAddress(null);
    setBalanceBot(null);
    try {
      if (wagmiConnected) {
        await disconnectAsync();
      }
    } catch {
      // ignore disconnect errors
    }
  }, [wagmiConnected, disconnectAsync]);

  const switchToBotchain = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const providerObj = await getEip1193Provider();
      if (providerObj) {
        await switchOrAddBotchainNetwork(providerObj);
        setDirectChainId(BOTCHAIN_CHAIN_ID);
        return true;
      }
      if (switchChainAsync) {
        await switchChainAsync({ chainId: BOTCHAIN_CHAIN_ID });
        setDirectChainId(BOTCHAIN_CHAIN_ID);
        return true;
      }
      throw new Error("No active Web3 wallet found to switch network.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not switch to Botchain Testnet.";
      setError(msg);
      return false;
    }
  }, [getEip1193Provider, switchChainAsync]);

  const copyAddress = useCallback(async (): Promise<boolean> => {
    if (!activeAddress || typeof navigator === "undefined" || !navigator.clipboard) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(activeAddress);
      return true;
    } catch {
      return false;
    }
  }, [activeAddress]);

  return {
    address: activeAddress,
    shortAddress: activeAddress ? shortenAddress(activeAddress) : "",
    chainId: activeChainId,
    isConnected,
    isCorrectChain,
    isConnecting,
    balanceBot,
    error,
    hasInjectedWallet,
    connectWallet,
    openWalletModal,
    disconnectWallet,
    switchToBotchain,
    copyAddress,
    getEip1193Provider,
  };
}


import { useState, useCallback, useEffect } from "react";
import { Eip1193Provider } from "ethers";
import {
  OnChainActivityEvent,
  checkHasProfileOnChain,
  fetchProfileEvents,
  fetchProfileFromChain,
  fetchTotalProfilesOnChain,
  formatContractError,
  getConfiguredContractAddress,
  getWriteContract,
  sanitizeFormPayload,
  verifyContractDeployed,
} from "../utils/contract";
import {
  ProfileData,
  ProfileFormData,
  validateProfileForm,
} from "../utils/validation";

export type TxLifecycleStatus =
  | "idle"
  | "validating"
  | "awaiting_signature"
  | "pending"
  | "confirmed"
  | "failed";

export interface TxRecord {
  txHash: string;
  action: "create" | "update";
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  timestamp: number;
  wallet: string;
}

export function useBotCard(
  walletAddress: string | null,
  isCorrectChain: boolean,
  getEip1193Provider: () => Promise<Eip1193Provider | undefined>
) {
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [txStatus, setTxStatus] = useState<TxLifecycleStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txBlockNumber, setTxBlockNumber] = useState<number | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const [contractAddress, setContractAddress] = useState<string>(() =>
    getConfiguredContractAddress()
  );
  const [isContractVerified, setIsContractVerified] = useState<boolean>(false);
  const [totalProfiles, setTotalProfiles] = useState<number | null>(null);

  const [activityEvents, setActivityEvents] = useState<OnChainActivityEvent[]>([]);
  const [activityAvailable, setActivityAvailable] = useState<boolean>(false);
  const [activityReason, setActivityReason] = useState<string | undefined>(undefined);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  const refreshContractMetadata = useCallback(async () => {
    const addr = getConfiguredContractAddress();
    setContractAddress(addr);
    if (!addr) {
      setIsContractVerified(false);
      setTotalProfiles(null);
      return;
    }
    const deployed = await verifyContractDeployed(addr);
    setIsContractVerified(deployed);
    if (deployed) {
      const total = await fetchTotalProfilesOnChain();
      setTotalProfiles(total);
    } else {
      setTotalProfiles(null);
    }
  }, []);

  const loadMyProfile = useCallback(async () => {
    if (!walletAddress) {
      setMyProfile(null);
      setProfileError(null);
      return null;
    }
    const addr = getConfiguredContractAddress();
    if (!addr) {
      setMyProfile(null);
      return null;
    }

    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const deployed = await verifyContractDeployed(addr);
      setIsContractVerified(deployed);
      if (!deployed) {
        setMyProfile(null);
        setProfileError(
          "BotCardRegistry contract is not deployed at the configured address on Botchain Testnet."
        );
        return null;
      }

      const profile = await fetchProfileFromChain(walletAddress);
      setMyProfile(profile);
      return profile;
    } catch (err: unknown) {
      const msg = formatContractError(err);
      setProfileError(msg);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [walletAddress]);

  const loadActivityEvents = useCallback(async (targetWallet?: string) => {
    setIsLoadingActivity(true);
    try {
      const result = await fetchProfileEvents(targetWallet);
      setActivityAvailable(result.available);
      setActivityEvents(result.events);
      setActivityReason(result.reason);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    refreshContractMetadata();
  }, [refreshContractMetadata]);

  useEffect(() => {
    if (walletAddress) {
      loadMyProfile();
    } else {
      setMyProfile(null);
    }
  }, [walletAddress, contractAddress, loadMyProfile]);

  const resetTxState = useCallback(() => {
    setTxStatus("idle");
    setTxHash(null);
    setTxBlockNumber(null);
    setTxError(null);
  }, []);

  const createProfileOnChain = useCallback(
    async (formData: ProfileFormData): Promise<ProfileData | null> => {
      setTxError(null);
      setTxHash(null);
      setTxBlockNumber(null);
      setTxStatus("validating");

      // 1. Validate the form
      const validation = validateProfileForm(formData);
      if (!validation.valid) {
        const firstErr = Object.values(validation.errors)[0] || "Invalid form data.";
        setTxError(firstErr);
        setTxStatus("failed");
        return null;
      }

      // 2. Verify connected wallet
      if (!walletAddress) {
        setTxError("Please connect your Web3 wallet before creating a profile.");
        setTxStatus("failed");
        return null;
      }

      // 3. Verify Botchain Testnet is selected
      if (!isCorrectChain) {
        setTxError("Incorrect network selected. Please switch to Botchain Testnet.");
        setTxStatus("failed");
        return null;
      }

      try {
        // 4. Check whether a profile already exists
        const alreadyExists = await checkHasProfileOnChain(walletAddress);
        if (alreadyExists) {
          setTxError(
            "A BotCard profile already exists for this wallet. Use Edit Profile to update it."
          );
          setTxStatus("failed");
          return null;
        }

        // 5 & 6. Prepare contract & request approval in wallet
        setTxStatus("awaiting_signature");
        const eipProvider = await getEip1193Provider();
        const { contract } = await getWriteContract(eipProvider);
        const clean = sanitizeFormPayload(formData);

        const tx = await contract.createProfile(
          clean.name,
          clean.headline,
          clean.bio,
          clean.email,
          clean.website,
          clean.socialHandle,
          clean.location,
          clean.profileType
        );

        // 7. Display pending transaction state
        setTxHash(tx.hash);
        setTxStatus("pending");

        // 8. Wait for transaction confirmation
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction reverted on Botchain Testnet.");
        }

        setTxBlockNumber(Number(receipt.blockNumber));

        // 9. Retrieve the saved profile from the blockchain
        const confirmedProfile = await fetchProfileFromChain(walletAddress);
        setMyProfile(confirmedProfile);

        // 10. Display success only after confirmation
        setTxStatus("confirmed");
        await refreshContractMetadata();
        await loadActivityEvents(walletAddress);

        return confirmedProfile;
      } catch (err: unknown) {
        const formatted = formatContractError(err);
        setTxError(formatted);
        setTxStatus("failed");
        return null;
      }
    },
    [
      walletAddress,
      isCorrectChain,
      getEip1193Provider,
      refreshContractMetadata,
      loadActivityEvents,
    ]
  );

  const updateProfileOnChain = useCallback(
    async (formData: ProfileFormData): Promise<ProfileData | null> => {
      setTxError(null);
      setTxHash(null);
      setTxBlockNumber(null);
      setTxStatus("validating");

      // 1. Validate the form
      const validation = validateProfileForm(formData);
      if (!validation.valid) {
        const firstErr = Object.values(validation.errors)[0] || "Invalid form data.";
        setTxError(firstErr);
        setTxStatus("failed");
        return null;
      }

      // 2. Verify connected wallet
      if (!walletAddress) {
        setTxError("Please connect your Web3 wallet before updating your profile.");
        setTxStatus("failed");
        return null;
      }

      // 3. Verify Botchain Testnet is selected
      if (!isCorrectChain) {
        setTxError("Incorrect network selected. Please switch to Botchain Testnet.");
        setTxStatus("failed");
        return null;
      }

      try {
        // 4. Verify profile exists on-chain
        const exists = await checkHasProfileOnChain(walletAddress);
        if (!exists) {
          setTxError("No existing profile found for this wallet. Create a profile first.");
          setTxStatus("failed");
          return null;
        }

        // 5 & 6. Call updateProfile() and request wallet signature
        setTxStatus("awaiting_signature");
        const eipProvider = await getEip1193Provider();
        const { contract } = await getWriteContract(eipProvider);
        const clean = sanitizeFormPayload(formData);

        const tx = await contract.updateProfile(
          clean.name,
          clean.headline,
          clean.bio,
          clean.email,
          clean.website,
          clean.socialHandle,
          clean.location,
          clean.profileType
        );

        // 7. Display pending state
        setTxHash(tx.hash);
        setTxStatus("pending");

        // 8. Wait for transaction confirmation
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) {
          throw new Error("Profile update transaction reverted on Botchain Testnet.");
        }

        setTxBlockNumber(Number(receipt.blockNumber));

        // 9. Refresh profile information from the blockchain
        const updatedProfile = await fetchProfileFromChain(walletAddress);
        setMyProfile(updatedProfile);

        // 10. Display success only after confirmation
        setTxStatus("confirmed");
        await loadActivityEvents(walletAddress);

        return updatedProfile;
      } catch (err: unknown) {
        const formatted = formatContractError(err);
        setTxError(formatted);
        setTxStatus("failed");
        return null;
      }
    },
    [walletAddress, isCorrectChain, getEip1193Provider, loadActivityEvents]
  );

  return {
    myProfile,
    isLoadingProfile,
    profileError,
    txStatus,
    txHash,
    txBlockNumber,
    txError,
    contractAddress,
    isContractVerified,
    totalProfiles,
    activityEvents,
    activityAvailable,
    activityReason,
    isLoadingActivity,
    loadMyProfile,
    loadActivityEvents,
    refreshContractMetadata,
    createProfileOnChain,
    updateProfileOnChain,
    resetTxState,
  };
}


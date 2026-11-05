import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import * as dotenv from "dotenv";

dotenv.config();

const BOTCHAIN_RPC_URL = process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life";
const BOTCHAIN_PRIVATE_KEY = process.env.BOTCHAIN_PRIVATE_KEY || "";

// Validate private key format (must be 64 hex chars, with or without 0x, and not all zeros)
const isValidPrivateKey = (key: string): boolean => {
  const clean = key.startsWith("0x") ? key.slice(2) : key;
  return /^[0-9a-fA-F]{64}$/.test(clean) && !/^0+$/.test(clean);
};

const accounts = isValidPrivateKey(BOTCHAIN_PRIVATE_KEY)
  ? [BOTCHAIN_PRIVATE_KEY.startsWith("0x") ? BOTCHAIN_PRIVATE_KEY : `0x${BOTCHAIN_PRIVATE_KEY}`]
  : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "paris",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 968,
    },
    botchain: {
      url: BOTCHAIN_RPC_URL,
      chainId: 968,
      accounts,
    },
    botchain677: {
      url: BOTCHAIN_RPC_URL,
      chainId: 677,
      accounts,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;


import { ethers, artifacts, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const EXPECTED_CHAIN_IDS = [968n, 677n];

async function main() {
  console.log("====================================================");
  console.log("🚀 Starting BotCardRegistry Deployment...");
  console.log(`🌐 Target Network Name: ${network.name}`);

  const provider = ethers.provider;
  const net = await provider.getNetwork();
  const chainId = net.chainId;
  console.log(`🔗 Connected Chain ID: ${chainId.toString()}`);

  if (!EXPECTED_CHAIN_IDS.includes(chainId)) {
    throw new Error(
      `Invalid network Chain ID ${chainId.toString()}. Expected Botchain Testnet (968 or 677).`
    );
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "No deployer wallet configured. Please set BOTCHAIN_PRIVATE_KEY in your local .env file (use a dedicated testnet wallet)."
    );
  }

  const deployer = signers[0];
  const balance = await provider.getBalance(deployer.address);
  console.log(`👛 Deployer Address:   ${deployer.address}`);
  console.log(`💰 Deployer Balance:   ${ethers.formatEther(balance)} BOT`);

  if (balance === 0n && network.name !== "hardhat") {
    throw new Error(
      `Deployer wallet ${deployer.address} has 0 BOT balance on Botchain Testnet. Please fund the wallet with testnet BOT before deploying.`
    );
  }

  const Factory = await ethers.getContractFactory("BotCardRegistry");
  console.log("⏳ Deploying BotCardRegistry...");
  const contract = await Factory.deploy();
  const deployTx = contract.deploymentTransaction();

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const txHash = deployTx?.hash || "";
  const receipt = await deployTx?.wait();

  console.log("====================================================");
  console.log("✅ BotCardRegistry Deployed Successfully!");
  console.log(`📍 Contract Address:   ${contractAddress}`);
  console.log(`🧾 Transaction Hash:   ${txHash}`);
  console.log(`📦 Block Number:       ${receipt?.blockNumber ?? "N/A"}`);
  console.log(`⛽ Gas Used:           ${receipt?.gasUsed?.toString() ?? "N/A"}`);
  console.log(`🔍 Explorer URL:       https://scan.bohr.life/address/${contractAddress}`);
  console.log("====================================================");

  // Save deployment info and export ABI for the frontend
  const abiDir = path.join(__dirname, "..", "src", "abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const artifact = await artifacts.readArtifact("BotCardRegistry");

  const abiExport = {
    contractName: "BotCardRegistry",
    address: contractAddress,
    chainId: Number(chainId),
    network: network.name,
    deploymentTxHash: txHash,
    blockNumber: receipt?.blockNumber ?? null,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const abiFilePath = path.join(abiDir, "BotCardRegistry.json");
  fs.writeFileSync(abiFilePath, JSON.stringify(abiExport, null, 2));
  console.log(`📁 Exported ABI & deployment metadata to: ${abiFilePath}`);

  const deploymentRecordPath = path.join(__dirname, "..", "deployment-info.json");
  fs.writeFileSync(
    deploymentRecordPath,
    JSON.stringify(
      {
        contractName: "BotCardRegistry",
        contractAddress,
        transactionHash: txHash,
        deployer: deployer.address,
        chainId: Number(chainId),
        network: network.name,
        blockNumber: receipt?.blockNumber ?? null,
        gasUsed: receipt?.gasUsed?.toString() ?? null,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`📁 Saved deployment record to: ${deploymentRecordPath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message || error);
  process.exitCode = 1;
});


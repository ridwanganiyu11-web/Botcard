# BotCard — Decentralized Web3 Contact Cards on Botchain Testnet

**BotCard** is a production-quality decentralized application (DApp) for creating, managing, verifying, and sharing **Personal** and **Business** contact cards on **Botchain Testnet** (`Chain ID: 968`, RPC: `https://rpc.bohr.life`).

Every wallet address can register and update one on-chain contact card stored directly in the lightweight `BotCardRegistry.sol` smart contract. Public profiles can be viewed by anyone via shareable URLs, exported as PNG QR codes, and downloaded as RFC-compliant `.vcf` vCard files—without any centralized backend, paid API, or subscription service.

---

## 1. Features

- **Dual Profile Categories**:
  - **Personal Card (`0`)**: Full name, professional headline, short biography, email, website, social handle, and location.
  - **Business Card (`1`)**: Business name, business category/headline, business description, business email, business website, social handle, and business location.
- **Real Web3 Wallet Connectivity**:
  - Built with `ethers.js v6`, `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi v2`, and `viem`.
  - Automatic detection of account changes, chain changes, and wallet disconnections.
  - One-click **Add / Switch to Botchain Testnet** (`wallet_switchEthereumChain` / `wallet_addEthereumChain`).
- **Lightweight, Gas-Optimized Smart Contract (`BotCardRegistry.sol`)**:
  - Zero external contract dependencies.
  - Custom Solidity errors, strict UTF-8 byte-length bounds, and `O(1)` profile storage & retrieval.
  - Emits `ProfileUpdated(address indexed wallet, uint8 profileType)` on creation and updates.
- **Public Shareable Profiles (`/profile/:walletAddress`)**:
  - Viewable by anyone without connecting a wallet or logging in.
  - Displays on-chain Botchain verification badge and transaction history.
- **Explore Directory (`/explore`)**:
  - Direct, gas-free `getProfile(address)` lookup by wallet address.
- **Local QR Code Generator**:
  - Generates high-contrast QR codes locally in the browser for any public profile URL.
  - Download QR code as `.png`, copy profile link, or share via the browser's native Web Share API.
- **Browser-Native vCard (`.vcf`) Export**:
  - Generates RFC-compliant `VERSION:3.0` `.vcf` files with proper character escaping (`\`, `,`, `;`, `\n`) for immediate import into iOS, Android, macOS, or desktop address books.

---

## 2. Technologies Used

| Layer | Stack |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, React Router v6, Lucide React Icons |
| **Blockchain & Wallet** | Solidity `0.8.24` (`evmVersion: "paris"`), Hardhat, `ethers.js v6`, `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi v2`, `viem`, `@tanstack/react-query` |
| **Utilities** | `qrcode` (local browser canvas/DataURL generation), Browser-native `Blob` for `.vcf` exports |
| **Testing** | Hardhat Toolbox (`Mocha` + `Chai`) for smart contract tests, `Vitest` + `@testing-library/react` for frontend tests |

---

## 3. Botchain Testnet Configuration

Use the following verified parameters to connect MetaMask or any EVM wallet to Botchain Testnet:

| Parameter | Value |
| :--- | :--- |
| **Network Name** | `Botchain Testnet` |
| **Chain ID** | `968` (`0x3c8`) |
| **RPC URL** | `https://rpc.bohr.life` |
| **Native Currency Symbol** | `BOT` (18 decimals, 150 Million Total Supply) |
| **Block Explorer URL** | `https://scan.bohr.life/` |

*(Note: `hardhat.config.ts` also includes a `botchain677` profile if you ever test against Chain ID 677).*

---

## 4. Installation & Environment Setup

### Prerequisites
- **Node.js** `v18+` (tested with Node `v24`) and **npm**
- **MetaMask** browser extension (or any compatible Web3 wallet)

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your dedicated **testnet deployer wallet** private key (never use a mainnet wallet with real funds, and never commit `.env` to git):

```ini
# Dedicated Botchain Testnet deployer private key (used ONLY by Hardhat CLI)
BOTCHAIN_PRIVATE_KEY=0xYOUR_DEDICATED_TESTNET_PRIVATE_KEY

# Botchain Testnet RPC URL
BOTCHAIN_RPC_URL=https://rpc.bohr.life

# Frontend public configuration
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_CHAIN_ID=968
VITE_RPC_URL=https://rpc.bohr.life
VITE_EXPLORER_URL=https://scan.bohr.life
VITE_REOWN_PROJECT_ID=b56e18d47c72ab683b10814fe9495694
```

---

## 5. Smart Contract Compilation & Testing

### Compile `BotCardRegistry.sol`
```bash
npx hardhat compile
```

### Run Smart Contract Automated Tests (including Gas Report)
```bash
npx hardhat test
```
This runs all 11 smart contract tests covering:
1. Profile creation & `ProfileUpdated` event emission
2. Personal profile (`0`) creation
3. Business profile (`1`) creation
4. Duplicate profile rejection (`ProfileAlreadyExists`)
5. Profile update (`updateProfile`)
6. Unauthorized update rejection (`Unauthorized` & `ProfileDoesNotExist`)
7. Invalid profile type rejection (`InvalidProfileType`)
8. UTF-8 byte string length validation (`InvalidNameLength` & `StringTooLong`)
9. Profile retrieval (`getProfile` & `hasProfile`)
10. Nonexistent profile lookup
11. Gas usage measurement for contract deployment, `createProfile`, and `updateProfile`

### Run Frontend Automated Unit & Component Tests
```bash
npm run test:unit
```

---

## 6. Deploying to Botchain Testnet

1. Ensure your dedicated testnet wallet in `.env` (`BOTCHAIN_PRIVATE_KEY`) is funded with testnet `BOT` for gas on Botchain Testnet (`Chain ID 968`).
2. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy.ts --network botchain
   ```
3. The deployment script will:
   - Verify the connected network Chain ID (`968`).
   - Check deployer wallet balance.
   - Deploy `BotCardRegistry` and wait for block confirmation.
   - Print the **Contract Address**, **Transaction Hash**, **Block Number**, and **Gas Used**.
   - Automatically export the deployed contract address and ABI to `src/abi/BotCardRegistry.json` and `deployment-info.json`.
4. Copy the printed contract address into `VITE_CONTRACT_ADDRESS` in your `.env` file (or paste it directly in the **About → BotCardRegistry Contract** settings panel in the UI).

---

## 7. Running the Frontend Application

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Build for Production
```bash
npm run build
```

---

## 8. User Guide

### Setting Up MetaMask
1. Click **Connect Wallet** in the top navigation bar.
2. If your wallet is on another network, click the amber **Switch / Add Botchain Testnet** button in the top bar (or on the **About** page).
3. Approve adding **Botchain Testnet** (`Chain ID: 968`, RPC: `https://rpc.bohr.life`, Symbol: `BOT`).

### Creating a Personal Contact Card
1. Navigate to **Create Card** (`/create`).
2. Select **Personal Card** (`0`).
3. Enter your **Full Name** (required, up to 80 bytes), **Professional Headline**, **Short Biography**, **Email**, **Website**, **Social Handle**, and **Location**.
4. Verify your card in the **Live On-Chain Card Preview** panel.
5. Click **Save Profile** and confirm the transaction in MetaMask.
6. Wait for block confirmation—your transaction hash and a link to `https://scan.bohr.life/` will appear once confirmed.

### Creating a Business Contact Card
1. Navigate to **Create Card** (`/create`).
2. Select **Business Card** (`1`).
3. Fill in your **Business Name**, **Business Category / Headline**, **Business Description**, **Business Email**, **Business Website**, **Social Handle**, and **Business Location**.
4. Click **Save Profile** and approve the transaction in MetaMask.

### Editing Your Profile
1. Navigate to **My Profile** (`/my-profile`).
2. Click **Edit Profile**.
3. Update any field (or switch between Personal and Business categories) and click **Update Profile On-Chain**.
4. Confirm the `updateProfile()` transaction in MetaMask.

### Sharing Public Profiles, Generating QR Codes & Downloading VCF Contacts
- **Share Public URL**: Open **My Profile** or any **Public Profile** (`/profile/0xYourWalletAddress`) and click **Share Profile** to share via native mobile share sheet or copy the link to your clipboard. Anyone can view `/profile/0x...` without connecting a wallet.
- **Generate QR Code**: Click **Generate QR Code** (or use the inline QR card on `/my-profile` and `/profile/:walletAddress`) to view the QR code, **Download PNG**, or copy the link.
- **Download Contact (`.vcf`)**: Click **Download Contact (.vcf)** on any profile card to download a standard vCard 3.0 file ready to import into iOS, Android, or desktop contacts.

---

## 9. Troubleshooting

- **"Wrong network detected / Switch to Botchain (968)"**:
  Click the **Switch to Botchain (968)** button in the header, or manually add Chain ID `968` with RPC `https://rpc.bohr.life` in MetaMask.
- **"BotCardRegistry contract address is not configured yet"**:
  Ensure you have deployed the contract with `npx hardhat run scripts/deploy.ts --network botchain` or entered the deployed contract address in `.env` (`VITE_CONTRACT_ADDRESS`) or on the **About** page.
- **"This wallet already owns a registered BotCard profile"**:
  Each wallet can own one profile. Go to **My Profile → Edit Profile** to update your existing contact card.
- **"Insufficient BOT balance"**:
  Your wallet needs a small amount of Botchain Testnet `BOT` to pay for transaction gas when creating or updating a profile. Viewing profiles and searching on `/explore` are read-only and require zero gas.


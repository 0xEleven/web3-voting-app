# Web3 Decentralized Voting dApp — School Project

**Author / Developer:** Ernerst Mutai  
**Project:** Decentralized Voting Application (dApp)  
**Curriculum Reference:** Lesson 10: DApps & Web3 Architecture  

---

## Technical Documentation & Presentation Dossier

- **Full Technical Specification & Defense Script:** [DOCUMENTATION.md](DOCUMENTATION.md)
- **Compiled Presentation & Defense PDF:** [Web3_Voting_dApp_Technical_Documentation.pdf](Web3_Voting_dApp_Technical_Documentation.pdf)
- **Print-Optimized HTML Documentation:** [docs/documentation.html](docs/documentation.html)

---

## System Architecture

This project strictly implements the 4-tier Web3 architecture from **Lesson 10**:

| Layer | Technology | Role & Functionality |
| :--- | :--- | :--- |
| **Frontend (UI Layer)** | React 18, Vite, Modern CSS | User interaction, voting interface, live vote counts, candidate registration, search & category filters |
| **Web3 / Wallet Layer** | MetaMask, Ethers.js v6 | Signs transactions, manages accounts, connects frontend to blockchain, real-time WebSocket/JSON-RPC event subscriptions |
| **Smart Contracts (Backend)** | Solidity ^0.8.20, Hardhat | Business rules, candidate storage, vote tallying, double-voting prevention, pause/resume circuit breaker |
| **Blockchain Network (Data)** | Hardhat Node (Localhost 8545) & Sepolia Testnet | Stores smart contracts, validates blocks, immutable state storage |

---

## Implemented Bonus Features (Lesson 10 Pages 12 & 13)

1. **Admin-Only Candidate Creation & Circuit Breaker:**
   - Contract deployer has access to `addCandidate(name)` and `setVotingStatus(bool)`.
   - Returning Officer UI allows pausing/resuming voting sessions and adding certified nominees directly on-chain.

2. **Real-Time Web3 Event Listeners:**
   - Subscribes to `Voted`, `CandidateAdded`, and `VotingStatusChanged` events.
   - Any transaction broadcasted anywhere on the network updates the UI in real-time without manual page reloads.

3. **Deploy to Sepolia Testnet:**
   - Full configuration in `hardhat.config.js` for Ethereum Sepolia (Chain ID `11155111`).
   - One-click network switch button in the UI header (`Sepolia Testnet`).
   - Dedicated deployment script: `scripts/deploySepolia.js`.

4. **Comprehensive Automated Unit Testing:**
   - 13 passing unit tests in `test/Voting.test.js` covering candidate setup, single-vote integrity, owner permissions, pause controls, and telemetry getters.

5. **Cryptographic Voter Receipt Export:**
   - When a ballot is cast, an immutable cryptographic receipt is generated with candidate choice, voter address, block number, and transaction hash.
   - 1-click **Copy Receipt JSON** button for audit verification.

6. **Online Production Deployment Ready:**
   - Pre-configured `vercel.json` for 1-click hosting on Vercel or Netlify.

---

## Project Directory Structure

```text
web3-voting-app/
├── contracts/
│   └── Voting.sol             # Smart Contract with Ernerst Mutai & bonus features
├── docs/
│   ├── documentation.html     # Print-optimized HTML documentation
│   └── Web3_Voting_dApp_Technical_Documentation.pdf # Presentation PDF
├── scripts/
│   ├── deploy.js              # Localhost deployment script
│   └── deploySepolia.js       # Sepolia testnet deployment script
├── test/
│   └── Voting.test.js         # 13 automated unit tests
├── artifacts/                 # Compiled EVM bytecode and ABI
├── hardhat.config.js          # Hardhat configuration (Solidity 0.8.20, Localhost & Sepolia)
├── vercel.json                # Online deployment configuration
├── .env.example               # Sepolia testnet environment template
├── DOCUMENTATION.md           # Full technical specification & defense guide
├── Web3_Voting_dApp_Technical_Documentation.pdf # Root presentation PDF
├── package.json               # Root dependencies and scripts
└── frontend/
    ├── src/
    │   ├── App.jsx            # Complete React dApp with real-time events & receipts
    │   ├── components/
    │   │   └── Icons.jsx      # High-visibility SVG icons
    │   ├── index.css          # Clean stylesheet (Impeccable compliant)
    │   ├── main.jsx           # React DOM root
    │   └── contracts/
    │       └── contractData.json # Synced address & ABI
    ├── index.html             # HTML entry point with Epilogue, Albert Sans, IBM Plex Mono
    ├── vite.config.js         # Vite configuration (port 3000)
    └── package.json           # Frontend dependencies (ethers v6, react)
```

---

## Quick Start Guide

### 1. Run Unit Tests (13/13 Passing)
```bash
cmd /c npx hardhat test
```

### 2. Start Local Blockchain Node
```bash
cmd /c npx hardhat node
```
Starts JSON-RPC node on `http://127.0.0.1:8545` (Chain ID `31337`) with 20 prefunded test accounts (10,000 ETH each).

### 3. Deploy Smart Contract Locally
```bash
cmd /c npx hardhat run scripts/deploy.js --network localhost
```

### 4. Deploy to Sepolia Testnet (Optional Bonus)
1. Copy `.env.example` to `.env` and enter your `SEPOLIA_PRIVATE_KEY`.
2. Run:
```bash
cmd /c npx hardhat run scripts/deploySepolia.js --network sepolia
```

### 5. Start the React Frontend
```bash
cd frontend
cmd /c npm run dev
```
Open `http://localhost:3000` in your browser.

---

## MetaMask Configuration

To connect MetaMask:
- **Localhost:** Click the **`Localhost (8545)`** button in the header (or manually add `http://127.0.0.1:8545`, Chain ID `31337`).
- **Sepolia Testnet:** Click the **`Sepolia Testnet`** button in the header (Chain ID `11155111`).
- **Import Key (Localhost Account #0):** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

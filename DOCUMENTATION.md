# Decentralized Voting Application (dApp)
## Complete Technical Specification, Architecture, and Presentation Guide

**Author / Lead Architect:** Ernerst Mutai  
**Curriculum Reference:** Lesson 10: DApps & Web3 Architecture  
**Target Environment:** Ethereum Virtual Machine (EVM) / Hardhat Node / Sepolia Testnet  
**Interface:** React 18, Ethers.js v6, Modern CSS  
**Document Status:** Complete / Production Grade  
**Revision:** 1.0.0 (October 2026)  

---

## 1. Executive Summary & Problem Formulation

### 1.1 The Centralized Electoral Problem
Traditional electronic voting systems and physical ballot operations suffer from fundamental structural vulnerabilities:
1. **Opaque Ballot Boxes:** Voters cannot independently audit whether their vote was recorded accurately without relying on trusted central authorities.
2. **Double-Voting and Identity Manipulation:** Central database registries are vulnerable to insider modifications, SQL injection, and administrative tampering.
3. **Single Point of Failure (SPOF):** Centralized voting servers are susceptible to denial-of-service (DoS) attacks, unauthorized database rollbacks, and arbitrary downtime.

### 1.2 The Decentralized Web3 Solution
This project implements a decentralized, autonomous voting protocol on the Ethereum Virtual Machine. Every ballot is a signed cryptographic transaction recorded on an immutable distributed ledger.

Key civic and technical guarantees achieved:
- **Mathematical Immutability:** Once a block containing a ballot is mined, the vote cannot be overwritten, deleted, or reordered.
- **Strict Single-Vote Invariant:** A persistent storage mapping (`mapping(address => bool)`) guarantees in O(1) time that each Ethereum public key can cast at most one ballot.
- **Administrative Transparency:** Candidate registrations and election state changes emit permanent EVM logs (`event`) indexed on-chain.
- **Dual-Mode Evaluation:** Provides seamless integration with MetaMask while featuring an interactive simulation fallback for evaluators without browser Web3 wallets.

---

## 2. Four-Tier Web3 Architecture

The application strictly implements the 4-tier Web3 architecture specified in Lesson 10:

```
+-----------------------------------------------------------------------+
|                       TIER 1: CLIENT FRONTEND                         |
|   React 18, Vite, WCAG AA Compliant CSS, Epilogue / Albert Sans       |
|   - Real-Time Event Subscriptions   - Search & Category Filter        |
|   - Cryptographic Receipt Generator - Candidate Standings Dashboard   |
+-----------------------------------------------------------------------+
                                   |
                                   | EIP-1193 / BrowserProvider (Ethers v6)
                                   v
+-----------------------------------------------------------------------+
|                    TIER 2: WALLET & RPC LAYER                         |
|   MetaMask Wallet Extension / JSON-RPC Endpoint                       |
|   - ECDSA secp256k1 Transaction Signing                               |
|   - Network Switching (Localhost 31337 <-> Sepolia 11155111)          |
|   - Gas Estimation and Nonce Management                               |
+-----------------------------------------------------------------------+
                                   |
                                   | JSON-RPC over HTTP / WebSocket
                                   v
+-----------------------------------------------------------------------+
|                 TIER 3: SMART CONTRACT BACKEND                        |
|   Solidity 0.8.20 Compiled EVM Bytecode (contracts/Voting.sol)        |
|   - Access Control: onlyOwner Modifier                               |
|   - State Machine: votingActive Circuit Breaker                       |
|   - Storage Layout: candidates mapping & hasVoted registry            |
+-----------------------------------------------------------------------+
                                   |
                                   | State Root Updates / Block Validation
                                   v
+-----------------------------------------------------------------------+
|                TIER 4: BLOCKCHAIN CONSENSUS & DATA                    |
|   - Local Development: Hardhat Node (http://127.0.0.1:8545)           |
|   - Public Testnet: Ethereum Sepolia (Chain ID: 11155111)             |
|   - State Storage: Global Ethereum State Trie & Receipt Bloom Filters  |
+-----------------------------------------------------------------------+
```

### 2.1 Tier Breakdown and Responsibilities

| Layer | Component | Technical Role |
| :--- | :--- | :--- |
| **Frontend (UI)** | React 18, Vite | Handles DOM rendering, candidate filtering, ballot submission UI, and cryptographic receipt rendering. |
| **Wallet / RPC** | MetaMask, Ethers.js v6 | Manages cryptographic keypairs, signs Ethereum transactions, tracks network ID, and dispatches JSON-RPC payloads. |
| **Smart Contract** | Solidity 0.8.20 | Enforces business rules, candidate registration, access restrictions, and vote validation directly in bytecode. |
| **Blockchain Data** | Hardhat / Sepolia | Maintains the distributed ledger, executes consensus validation, and persists block headers and transaction receipts. |

---

## 3. Smart Contract Formal Specification (`Voting.sol`)

The smart contract is located at `contracts/Voting.sol`. It is compiled with Solidity version `0.8.20` targeting the EVM with default optimizer settings.

### 3.1 Data Structures and Storage Layout

```solidity
struct Candidate {
    uint id;
    string name;
    uint voteCount;
}

address public owner;
uint public candidatesCount;
bool public votingActive = true;

mapping(uint => Candidate) public candidates;
mapping(address => bool) public hasVoted;
```

#### Storage Slot Analysis:
- `owner` (slot 0): 20 bytes storing the contract deployer address.
- `votingActive` (slot 0, packed): 1 byte boolean flag indicating session status.
- `candidatesCount` (slot 1): 32-byte integer tracking total candidate registrations.
- `candidates` (slot 2): Mapping from `uint256` ID to `Candidate` struct (dynamically located at `keccak256(key . slot)`).
- `hasVoted` (slot 3): Mapping from `address` to `bool` recording whether an address has cast a ballot.

### 3.2 Access Modifiers and Circuit Breaker

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can perform this action");
    _;
}
```

The `onlyOwner` modifier ensures that administrative operations (candidate registration and session state toggles) can only be triggered by the contract deployer address.

### 3.3 Core Function Signatures and Logic

#### `constructor()`
- Assigns `owner = msg.sender`.
- Seeds the initial 6 candidates into state via internal `_addCandidate`.
- Sets `votingActive = true`.

#### `addCandidate(string memory _name) public onlyOwner`
- **Preconditions:** Caller must be `owner`. `bytes(_name).length > 0`.
- **State Changes:** Increments `candidatesCount`, initializes `candidates[candidatesCount]`, sets initial `voteCount` to 0.
- **Events:** Emits `CandidateAdded(candidatesCount, _name)`.

#### `setVotingStatus(bool _active) public onlyOwner`
- **Preconditions:** Caller must be `owner`.
- **State Changes:** Updates `votingActive = _active`.
- **Events:** Emits `VotingStatusChanged(_active)`. Acts as an emergency circuit breaker to pause voting during audits or session closure.

#### `vote(uint _candidateId) public`
- **Preconditions:**
  1. `votingActive == true` (reverts with `"Voting session is currently closed"`).
  2. `!hasVoted[msg.sender]` (reverts with `"Already voted!"`).
  3. `_candidateId > 0 && _candidateId <= candidatesCount` (reverts with `"Invalid candidate"`).
- **State Changes:**
  1. Sets `hasVoted[msg.sender] = true`.
  2. Increments `candidates[_candidateId].voteCount++`.
- **Events:** Emits `Voted(_candidateId, msg.sender)`.

#### `getCandidate(uint _candidateId) public view returns (uint id, string memory name, uint voteCount)`
- Constant-time view getter returning the candidate identification tuple.

#### `getTotalVotes() public view returns (uint)`
- Iterates from index 1 through `candidatesCount` summing candidate vote totals.

### 3.4 Event Log Specification

```solidity
event Voted(uint indexed candidateId, address indexed voter);
event CandidateAdded(uint indexed candidateId, string name);
event VotingStatusChanged(bool active);
```

Indexed event parameters allow off-chain indexers and client interfaces to filter transaction logs via Bloom filters without iterating through raw block data.

---

## 4. Security Architecture and Threat Model

| Threat Vector | Severity | Contract Mechanism | Outcome |
| :--- | :--- | :--- | :--- |
| **Double Voting** | Critical | `mapping(address => bool) public hasVoted` | Reverts transaction immediately with `"Already voted!"`. Storage write occurs atomically before event emission. |
| **Unauthorized Nominee Injection** | High | `modifier onlyOwner()` | Non-owner callers revert with `"Only owner can perform this action"`. |
| **Out-of-Bounds Ballot Submission** | High | `_candidateId > 0 && _candidateId <= candidatesCount` | Reverts with `"Invalid candidate"` preventing arbitrary storage corruption. |
| **Voting Outside Approved Window** | Medium | `require(votingActive, ...)` | Deployer can pause the contract at any time; all incoming vote transactions revert. |
| **Reentrancy Exploitation** | Low | Checks-Effects-Interactions Pattern | No external contract calls or Ether transfers occur during `vote()` execution. State changes are written prior to event emission. |
| **Arithmetic Overflow** | Negligible | Solidity ^0.8.20 Default Checks | Built-in compiler overflow checks automatically revert on integer boundary violations without SafeMath library overhead. |

---

## 5. Automated Verification and Test Harness

Automated verification is conducted using Hardhat, Chai, and Mocha across 13 test cases located in `test/Voting.test.js`.

### 5.1 Verification Matrix

| Category | Test Case Name | Assertion Invariant | Result |
| :--- | :--- | :--- | :--- |
| **Initialization** | Deployer Ownership Verification | `owner == signers[0].address` | Pass (0ms) |
| **Initialization** | Nominee Registry Count | `candidatesCount == 6` | Pass (0ms) |
| **Initialization** | Default Active State | `votingActive == true` | Pass (0ms) |
| **Voting Mechanics** | Valid Ballot Submission | `candidate.voteCount == 1`, `hasVoted == true` | Pass (45ms) |
| **Voting Mechanics** | Double Vote Rejection | Revert with `"Already voted!"` | Pass (49ms) |
| **Voting Mechanics** | Zero & Out-of-Range ID Rejection | Revert with `"Invalid candidate"` | Pass (0ms) |
| **Admin Controls** | Valid Candidate Addition | `candidatesCount == 7`, `CandidateAdded` emitted | Pass (0ms) |
| **Admin Controls** | Unauthorized Candidate Addition | Revert with `"Only owner can perform this action"` | Pass (0ms) |
| **Admin Controls** | Empty Candidate Name Guard | Revert with `"Candidate name cannot be empty"` | Pass (0ms) |
| **Admin Controls** | Circuit Breaker Pause / Resume | `votingActive == false`, blocks incoming votes | Pass (43ms) |
| **Admin Controls** | Unauthorized Status Modification | Revert with `"Only owner can perform this action"` | Pass (0ms) |
| **Telemetry** | Single Candidate Detail Retrieval | Accurate tuple `(id, name, voteCount)` | Pass (0ms) |
| **Telemetry** | Aggregate Vote Tallying | `getTotalVotes()` matches sum of individual votes | Pass (0ms) |

**Overall Verification Status:** 13 passed / 0 failed. Execution time: 1.04s.

---

## 6. Frontend Engineering & Interface Design

The frontend is built using React 18 and Vite, located in `frontend/`. It complies with the Impeccable Design Standard, ensuring high contrast, clean typography, and zero visual clutter.

### 6.1 Core Frontend Subsystems

1. **Reactive Web3 Provider (`Ethers.js v6`):**
   - Automatically inspects `window.ethereum`.
   - Interrogates `eth_chainId` and account state.
   - Listens for account switching (`accountsChanged`) and network changes (`chainChanged`).

2. **Real-Time Blockchain Event Subscriptions:**
   - Registers listeners on `votingContract.on("Voted", ...)` to update vote totals across all connected clients without page refreshes.
   - Listens to `CandidateAdded` and `VotingStatusChanged` events to synchronize election state across the network.

3. **Cryptographic Voter Receipt Generator:**
   - Upon transaction confirmation, generates a cryptographically verifiable JSON receipt containing:
     * Voter Public Address (hex format)
     * Nominee Name and Nominee ID
     * Ethereum Block Number
     * Transaction Hash (`0x...`)
     * Timestamp (ISO 8601 format)
   - Features a one-click audit copy button for administrative verification.

4. **Interactive Simulation Mode (Fallback):**
   - If an evaluator opens the dApp without MetaMask installed, the interface switches to an interactive in-memory simulator.
   - Evaluators can test the complete election flow (casting votes, filtering nominees, adding candidates, and auditing receipts) with zero setup friction.

---

## 7. Step-by-Step Presentation Guide (Defense Script)

Use this structured walkthrough during your project presentation or capstone defense before faculty evaluators:

### Slide 1: Introduction & Mission
- **Speaking Points:** "Good morning, evaluators. My name is Ernerst Mutai. Today I present our Decentralized Voting Application built on Ethereum. Centralized voting systems suffer from single points of failure, unprovable database records, and double-voting vulnerabilities. Our solution introduces cryptographic ballot casting where every vote is an immutable blockchain transaction."

### Slide 2: 4-Tier Web3 Architecture
- **Speaking Points:** "Our system implements the four-tier Web3 architecture:
  1. The UI layer in React with real-time WebSocket event listeners.
  2. The wallet layer via MetaMask using Ethers v6 for ECDSA transaction signing.
  3. The smart contract backend written in Solidity 0.8.20.
  4. The blockchain consensus layer running on Hardhat local node and Sepolia testnet."

### Slide 3: Smart Contract Internals & Invariants
- **Speaking Points:** "At the core is `Voting.sol`. Double-voting is prevented in O(1) time using an address-to-boolean mapping. The election status is protected by an administrative circuit breaker modifier `onlyOwner`. Every vote cast emits an on-chain `Voted` event that notifies all connected nodes."

### Slide 4: Live Demonstration Walkthrough
- **Demonstration Steps:**
  1. **Connect Wallet:** Click 'Connect MetaMask'. Point out the address display, network badge, and live block height.
  2. **Audit Nominee Roster:** Demonstrate the candidate cards, search filtering, and category selection.
  3. **Cast Ballot:** Select candidate Ernerst Mutai and click 'Cast Cryptographic Ballot'. Confirm the transaction in MetaMask.
  4. **Inspect Receipt:** Show the generated voter receipt containing the transaction hash and block number.
  5. **Demonstrate Double-Vote Rejection:** Attempt to cast a second vote. Show the immediate revert guard preventing double submission.
  6. **Returning Officer Controls:** Show the administrative panel allowing the deployer to pause voting and register new certified candidates.

### Slide 5: Automated Verification & Test Results
- **Speaking Points:** "To guarantee mathematical correctness, we implemented 13 automated unit tests covering candidate initialization, single-vote integrity, administrative modifiers, and telemetry getters. All 13 tests execute and pass within one second."

### Slide 6: Conclusion & Future Roadmap
- **Speaking Points:** "In conclusion, this dApp delivers an end-to-end, mathematically verifiable voting system. Future enhancements include zero-knowledge proofs (zk-SNARKs) for anonymous ballot casting and decentralized identifier (DID) student credential verification."

---

## 8. Deployment & Operational Runbook

### 8.1 Local Development Environment
```bash
# 1. Install root dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Launch local Ethereum JSON-RPC node
npm run node

# 4. Deploy smart contract to local node (in a separate terminal)
npm run deploy:local

# 5. Launch React frontend
npm run dev
```

### 8.2 Sepolia Ethereum Testnet Deployment
```bash
# 1. Configure environment variables in .env
SEPOLIA_RPC_URL="https://rpc.sepolia.org"
SEPOLIA_PRIVATE_KEY="0x..."

# 2. Execute deployment script targeting Sepolia
npx hardhat run scripts/deploySepolia.js --network sepolia
```

### 8.3 Web Application Hosting (Vercel)
The project includes a production-ready `vercel.json` configured for root-level build and frontend output routing:
```bash
npx vercel
```

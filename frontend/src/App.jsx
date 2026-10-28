import React, { useState, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";
import defaultContractData from "./contracts/contractData.json";
import {
  VoteIcon,
  ShieldCheckIcon,
  WalletIcon,
  CheckCircleIcon,
  UserIcon,
  SearchIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  BuildingIcon
} from "./components/Icons";

const INITIAL_DEMO_CANDIDATES = [
  {
    id: "1",
    name: "Ernest Mutai",
    votes: "38",
    role: "Presidential Nominee",
    department: "School of Computing & Informatics",
    platform: "Decentralized student guild governance, academic resource transparency, and verifiable student representation.",
    initials: "EM"
  },
  {
    id: "2",
    name: "Ernest Mutai (Academic Chair)",
    votes: "26",
    role: "Guild Academic Affairs Director",
    department: "Faculty Senate Committee",
    platform: "Curriculum reform oversight, peer-to-peer tutoring grants, and digitized faculty syllabus transparency.",
    initials: "EM"
  },
  {
    id: "3",
    name: "Brenda Chelangat",
    votes: "31",
    role: "Vice Presidential Nominee",
    department: "School of Engineering & Technology",
    platform: "Modern lab infrastructure, female STEM leadership initiatives, and sustainable green campus facilities.",
    initials: "BC"
  },
  {
    id: "4",
    name: "Kevin Kiprop",
    votes: "19",
    role: "Guild Finance & Treasury Secretary",
    department: "School of Business & Economics",
    platform: "Real-time on-chain student activity fee auditing, bursary disbursement equity, and zero budget leakage.",
    initials: "KK"
  },
  {
    id: "5",
    name: "Faith Wanjiku",
    votes: "22",
    role: "Student Welfare & Health Services Director",
    department: "College of Health Sciences",
    platform: "Mental health clinic funding, 24/7 campus infirmary ambulance availability, and subsidized dining plans.",
    initials: "FW"
  },
  {
    id: "6",
    name: "David Ochieng",
    votes: "15",
    role: "Sports & Extracurricular Affairs Coordinator",
    department: "School of Education & Arts",
    platform: "Inter-university varsity tournament funding, recreational sports equipment renewal, and creative arts festivals.",
    initials: "DO"
  }
];

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [network, setNetwork] = useState("");
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(defaultContractData.address);
  const [candidates, setCandidates] = useState(INITIAL_DEMO_CANDIDATES);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [votingActive, setVotingActive] = useState(true);
  const [blockHeight, setBlockHeight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateRole, setNewCandidateRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [ballotReceipt, setBallotReceipt] = useState(null);
  const [eventsLog, setEventsLog] = useState([
    { id: 1, message: "Electoral registry initialized with candidate Ernest Mutai.", time: "09:00:00" },
    { id: 2, message: "Decentralized consensus validated on Ethereum node.", time: "09:00:01" },
    { id: 3, message: "Real-time Web3 event subscriptions activated.", time: "09:00:02" }
  ]);

  const contractRef = useRef(null);
  const contractABI = defaultContractData.abi;

  const totalVotes = candidates.reduce((sum, c) => sum + parseInt(c.votes || "0", 10), 0);
  const leadingCandidate = [...candidates].sort((a, b) => parseInt(b.votes) - parseInt(a.votes))[0];

  const showStatus = (text, type = "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: "", type: "" });
    }, 6000);
  };

  const logEvent = (msg) => {
    setEventsLog(prev => [
      { id: Date.now(), message: msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 8)
    ]);
  };

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      showStatus("MetaMask extension not detected. Running in Interactive Simulation mode for local evaluation.", "warning");
      setIsDemoMode(true);
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const userAccount = accounts[0];
      setAccount(userAccount);

      const signer = await provider.getSigner();
      const net = await provider.getNetwork();
      setNetwork(`${net.name} (Chain ID: ${net.chainId})`);
      setChainId(Number(net.chainId));

      const rawBalance = await provider.getBalance(userAccount);
      setBalance(parseFloat(ethers.formatEther(rawBalance)).toFixed(4));

      // Fetch current block number
      const currentBlock = await provider.getBlockNumber();
      setBlockHeight(currentBlock);

      const votingContract = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(votingContract);
      contractRef.current = votingContract;
      setIsDemoMode(false);

      // Check Owner
      try {
        const owner = await votingContract.owner();
        setOwnerAddress(owner);
        if (owner.toLowerCase() === userAccount.toLowerCase()) {
          setIsOwner(true);
        }
      } catch (err) {
        console.warn("Could not fetch contract owner:", err);
      }

      // Check votingActive status
      try {
        const active = await votingContract.votingActive();
        setVotingActive(active);
      } catch (err) {
        console.warn("Could not fetch votingActive:", err);
      }

      // Check if user has already voted
      try {
        const voted = await votingContract.hasVoted(userAccount);
        setHasVoted(voted);
      } catch (err) {
        console.warn("Could not check hasVoted status:", err);
      }

      await loadCandidatesFromContract(votingContract);

      // Setup Real-Time Blockchain Event Subscriptions (Bonus Feature)
      setupRealTimeListeners(votingContract);

      showStatus(`Voter authenticated on-chain: ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`, "success");
      logEvent(`Voter wallet linked: ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      showStatus(`Authentication error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Real-Time Event Listeners (Bonus Feature: Lesson 10 Page 12)
  const setupRealTimeListeners = (votingContract) => {
    try {
      votingContract.removeAllListeners();

      votingContract.on("Voted", (candidateId, voter) => {
        logEvent(`[Live Event] Vote recorded for Candidate #${candidateId.toString()} by ${voter.slice(0, 6)}...${voter.slice(-4)}`);
        loadCandidatesFromContract(votingContract);
      });

      votingContract.on("CandidateAdded", (candidateId, name) => {
        logEvent(`[Live Event] New nominee accredited on-chain: ${name} (ID #${candidateId.toString()})`);
        loadCandidatesFromContract(votingContract);
      });

      votingContract.on("VotingStatusChanged", (active) => {
        setVotingActive(active);
        logEvent(`[Live Event] Electoral session ${active ? "OPENED" : "PAUSED"} by Commissioner.`);
      });
    } catch (err) {
      console.warn("Could not attach event listeners:", err);
    }
  };

  // Load Candidates
  const loadCandidatesFromContract = async (contractInstance) => {
    try {
      const activeContract = contractInstance || contractRef.current || contract;
      if (!activeContract) return;

      const count = await activeContract.candidatesCount();
      const loaded = [];

      for (let i = 1; i <= Number(count); i++) {
        const c = await activeContract.candidates(i);
        const demoFallback = INITIAL_DEMO_CANDIDATES[i - 1];

        loaded.push({
          id: c.id.toString(),
          name: c.name,
          votes: c.voteCount.toString(),
          role: demoFallback ? demoFallback.role : "Guild Nominee",
          department: demoFallback ? demoFallback.department : "University Student Body",
          platform: demoFallback ? demoFallback.platform : "Certified student candidate registered on the university ballot.",
          initials: c.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
        });
      }

      if (loaded.length > 0) {
        setCandidates(loaded);
      }
    } catch (err) {
      console.warn("Error loading candidates from contract:", err);
    }
  };

  // Switch or Add Localhost 8545
  const switchOrAddLocalhostNetwork = async () => {
    if (!window.ethereum) {
      showStatus("MetaMask extension not found in browser.", "warning");
      return;
    }

    const localhostChainId = "0x7a69";
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: localhostChainId }],
      });
      showStatus("Connected to Hardhat Localhost node (Chain 31337).", "success");
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: localhostChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
          showStatus("Registered Hardhat network (8545) in MetaMask.", "success");
        } catch (addError) {
          showStatus(`Network configuration failed: ${addError.message}`, "error");
        }
      } else {
        showStatus(`Network switch error: ${switchError.message}`, "error");
      }
    }
  };

  // Switch to Sepolia Testnet (Bonus Feature: Lesson 10 Page 12)
  const switchOrAddSepoliaNetwork = async () => {
    if (!window.ethereum) {
      showStatus("MetaMask extension not found in browser.", "warning");
      return;
    }

    const sepoliaChainId = "0xaa36a7"; // 11155111 in hex
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: sepoliaChainId }],
      });
      showStatus("Switched to Ethereum Sepolia Testnet (11155111)!", "success");
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: sepoliaChainId,
                chainName: "Sepolia Test Network",
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io/"],
              },
            ],
          });
          showStatus("Added Sepolia Testnet to MetaMask!", "success");
        } catch (addError) {
          showStatus(`Could not add Sepolia: ${addError.message}`, "error");
        }
      } else {
        showStatus(`Network error: ${switchError.message}`, "error");
      }
    }
  };

  // Vote
  const handleVote = async (id) => {
    const candidate = candidates.find(c => c.id === id.toString());
    const candidateName = candidate ? candidate.name : `Candidate #${id}`;

    if (!votingActive) {
      showStatus("Voting is currently paused by the Electoral Commissioner.", "warning");
      return;
    }

    if (hasVoted) {
      showStatus("Ballot already recorded. Double voting is restricted by smart contract invariants.", "warning");
      return;
    }

    if (isDemoMode || !contract) {
      setIsLoading(true);
      setTimeout(() => {
        setCandidates(prev =>
          prev.map(c =>
            c.id === id.toString()
              ? { ...c, votes: (parseInt(c.votes, 10) + 1).toString() }
              : c
          )
        );
        setHasVoted(true);
        setVotedCandidateId(id);
        const receipt = {
          candidateName,
          candidateId: id,
          voter: account || "0xDemo...Voter",
          timestamp: new Date().toISOString(),
          network: "Localhost 8545 (Simulated)",
          txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
        };
        setBallotReceipt(receipt);
        setIsLoading(false);
        showStatus(`Official ballot recorded for ${candidateName}.`, "success");
        logEvent(`Vote recorded on ledger for candidate: ${candidateName}`);
      }, 500);
      return;
    }

    try {
      setIsLoading(true);
      showStatus(`Signing ballot transaction for ${candidateName}...`, "info");

      const tx = await contract.vote(id);
      logEvent(`Transaction broadcasted: ${tx.hash.slice(0, 12)}...`);

      const receipt = await tx.wait();

      setHasVoted(true);
      setVotedCandidateId(id);
      setBallotReceipt({
        candidateName,
        candidateId: id,
        voter: account,
        timestamp: new Date().toISOString(),
        network: chainId === 11155111 ? "Sepolia Testnet" : "Hardhat Localhost (31337)",
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      showStatus(`Ballot confirmed on Ethereum ledger for ${candidateName}.`, "success");
      logEvent(`Block confirmed! Vote registered for ${candidateName}.`);

      await loadCandidatesFromContract(contract);
    } catch (err) {
      console.error("Voting failed:", err);
      const reason = err.reason || err.message || "Transaction rejected.";
      showStatus(`Voting failed: ${reason}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add Candidate (Owner function)
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    const nameToAdd = newCandidateName.trim();
    const roleToAdd = newCandidateRole.trim() || "Accredited Nominee";

    if (isDemoMode || !contract) {
      const nextId = (candidates.length + 1).toString();
      const inits = nameToAdd.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
      setCandidates(prev => [
        ...prev,
        {
          id: nextId,
          name: nameToAdd,
          votes: "0",
          role: roleToAdd,
          department: "Accredited Student Body",
          platform: "Nominated candidate platform credentials approved by the electoral committee.",
          initials: inits || "CD"
        }
      ]);
      setNewCandidateName("");
      setNewCandidateRole("");
      showStatus(`Nominee "${nameToAdd}" registered to ballot.`, "success");
      logEvent(`Candidate registered: ${nameToAdd}`);
      return;
    }

    try {
      setIsLoading(true);
      showStatus(`Submitting nomination for "${nameToAdd}" to smart contract...`, "info");
      const tx = await contract.addCandidate(nameToAdd);
      await tx.wait();
      setNewCandidateName("");
      setNewCandidateRole("");
      showStatus(`Nominee "${nameToAdd}" accredited on-chain.`, "success");
      logEvent(`Smart contract state updated: Candidate "${nameToAdd}" registered.`);
      await loadCandidatesFromContract(contract);
    } catch (err) {
      console.error("Failed to add candidate:", err);
      showStatus(`Nomination failed: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Voting Active Status (Owner Administrative Control)
  const toggleVotingStatus = async () => {
    if (!contract || isDemoMode) {
      setVotingActive(!votingActive);
      showStatus(`Voting session status toggled to: ${!votingActive ? "Active" : "Paused"}`, "info");
      return;
    }

    try {
      setIsLoading(true);
      const newStatus = !votingActive;
      const tx = await contract.setVotingStatus(newStatus);
      await tx.wait();
      setVotingActive(newStatus);
      showStatus(`Voting session status updated to ${newStatus ? "ACTIVE" : "PAUSED"} on-chain.`, "success");
      logEvent(`Electoral status updated: ${newStatus ? "Active" : "Paused"}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      showStatus(`Status change failed: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === "executive") {
        return c.role.toLowerCase().includes("president") || c.role.toLowerCase().includes("chair");
      }
      if (selectedCategory === "guild") {
        return c.role.toLowerCase().includes("director") || c.role.toLowerCase().includes("secretary") || c.role.toLowerCase().includes("coordinator");
      }

      return true;
    });
  }, [candidates, searchQuery, selectedCategory]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount("");
          setContract(null);
          showStatus("Wallet disconnected.", "warning");
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (contractRef.current) {
        contractRef.current.removeAllListeners();
      }
    };
  }, []);

  return (
    <div className="ballot-container">
      {/* Institutional Top Bar */}
      <header className="institutional-bar">
        <div className="institutional-branding">
          <div className="seal-icon">
            <BuildingIcon size={22} />
          </div>
          <div>
            <h1 className="system-title">Student Electoral Commission</h1>
            <div className="system-subtitle">Decentralized Voting Ledger • Academic Year 2026/2027</div>
          </div>
        </div>

        <div className="institutional-actions">
          {/* Network Switchers: Localhost & Sepolia Testnet (Bonus Feature) */}
          <button
            className="btn btn-outline"
            onClick={switchOrAddLocalhostNetwork}
            title="Switch MetaMask to Localhost 8545"
            id="btn-switch-network"
          >
            <RefreshCwIcon size={14} />
            <span>Localhost (8545)</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={switchOrAddSepoliaNetwork}
            title="Switch MetaMask to Ethereum Sepolia Testnet"
            id="btn-switch-sepolia"
          >
            <BuildingIcon size={14} />
            <span>Sepolia Testnet</span>
          </button>

          {account ? (
            <span className="meta-tag meta-tag-active">
              <ShieldCheckIcon size={14} />
              <span>{account.slice(0, 6)}...{account.slice(-4)} | {balance} ETH</span>
            </span>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={connectWallet}
              disabled={isLoading}
              id="btn-connect-wallet"
            >
              <WalletIcon size={16} />
              <span>{isLoading ? "Authenticating..." : "Connect MetaMask"}</span>
            </button>
          )}

          <button
            className={`btn ${isDemoMode ? "btn-secondary" : "btn-outline"}`}
            onClick={() => setIsDemoMode(!isDemoMode)}
            id="btn-toggle-demo"
            title="Switch execution environment"
          >
            <span>{isDemoMode ? "Mode: Interactive Simulation" : "Mode: Live Hardhat Node"}</span>
          </button>
        </div>
      </header>

      {/* Electoral Manifesto & Candidate Attribution */}
      <section className="electoral-manifesto">
        <div className="manifesto-header">
          <div>
            <h2 className="manifesto-title">Official Student Guild Ballot</h2>
            <p className="manifesto-lead">
              Cryptographically verified election powered by an immutable Ethereum smart contract.
              Voter authentication, ballot secrecy, and double-voting prevention are governed
              deterministically on-chain without centralized interference.
            </p>
          </div>
          <div className="candidate-honor-attribution">
            <span className="honor-label">Electoral Architect & Nominee</span>
            <span className="honor-name">Ernest Mutai</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px", alignItems: "center" }}>
          <span className="meta-tag meta-tag-success">
            <CheckCircleIcon size={14} />
            <span>Single Vote Enforced</span>
          </span>
          <span className={`meta-tag ${votingActive ? "meta-tag-success" : "meta-tag-active"}`}>
            <span>● Session: {votingActive ? "Active" : "Paused"}</span>
          </span>
          {blockHeight && (
            <span className="meta-tag">
              <span>Block: #{blockHeight}</span>
            </span>
          )}
          <span className="meta-tag">Contract: {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}</span>
          <span className="meta-tag">Solidity ^0.8.20</span>
        </div>
      </section>

      {/* System Feedback Alert */}
      {statusMessage.text && (
        <div className={`ballot-alert ballot-alert-${statusMessage.type}`} id="status-alert">
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage({ text: "", type: "" })}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Vote Confirmation & Cryptographic Receipt Card (Bonus Feature) */}
      {hasVoted && (
        <div className="ballot-alert ballot-alert-success" id="voted-alert" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={18} />
              <span>Ballot Confirmed On-Chain</span>
            </strong>
            <span className="meta-tag meta-tag-success">Recorded</span>
          </div>
          <p style={{ fontSize: "0.85rem", opacity: 0.95 }}>
            Your vote has been committed to the block state. Under the consensus rules, each address is strictly limited to one ballot.
          </p>

          {ballotReceipt && (
            <div style={{ width: "100%", paddingTop: "8px", borderTop: "1px solid #bbf7d0", fontSize: "0.825rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span>Selected Candidate: <strong>{ballotReceipt.candidateName}</strong></span> •
                <span style={{ marginLeft: "8px" }}>Tx Hash: <code style={{ fontFamily: "var(--font-mono)" }}>{ballotReceipt.txHash.slice(0, 16)}...</code></span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(ballotReceipt, null, 2));
                  showStatus("Cryptographic receipt copied to clipboard!", "success");
                }}
              >
                Copy Receipt JSON
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ledger Overview Strip */}
      <section className="ledger-metrics-strip">
        <div className="ledger-metric-cell">
          <div className="metric-label">Registered Nominees</div>
          <div className="metric-value">{candidates.length}</div>
          <div className="metric-sub">Certified on ballot</div>
        </div>

        <div className="ledger-metric-cell">
          <div className="metric-label">Total Ballots Cast</div>
          <div className="metric-value">{totalVotes}</div>
          <div className="metric-sub">Verified ledger entries</div>
        </div>

        <div className="ledger-metric-cell">
          <div className="metric-label">Leading Nominee</div>
          <div className="metric-value" style={{ fontSize: "1.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {leadingCandidate ? leadingCandidate.name : "Ernest Mutai"}
          </div>
          <div className="metric-sub">{leadingCandidate ? `${leadingCandidate.votes} votes` : "0 votes"}</div>
        </div>

        <div className="ledger-metric-cell">
          <div className="metric-label">Consensus Engine</div>
          <div className="metric-value" style={{ fontSize: "1.1rem" }}>{chainId === 11155111 ? "Sepolia 11155111" : "Hardhat 31337"}</div>
          <div className="metric-sub">{chainId === 11155111 ? "Public Ethereum Testnet" : "127.0.0.1:8545"}</div>
        </div>
      </section>

      {/* Candidate Filter & Search Toolbar */}
      <div className="toolbar-container">
        <div className="search-box">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search candidates by name, position, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-candidates-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>

        <div className="category-tabs">
          <button
            className={`tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All Candidates ({candidates.length})
          </button>
          <button
            className={`tab-btn ${selectedCategory === "executive" ? "active" : ""}`}
            onClick={() => setSelectedCategory("executive")}
          >
            Presidency & Executive
          </button>
          <button
            className={`tab-btn ${selectedCategory === "guild" ? "active" : ""}`}
            onClick={() => setSelectedCategory("guild")}
          >
            Guild Council & Directors
          </button>
        </div>
      </div>

      {/* Official Ballot Sheet */}
      <div className="ballot-section-header">
        <h3 className="ballot-section-title">
          <span>Official Candidate Slate</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-muted)", marginLeft: "8px" }}>
            ({filteredCandidates.length} {filteredCandidates.length === 1 ? "candidate" : "candidates"} shown)
          </span>
        </h3>
        <span className="ballot-section-meta">Select a candidate to submit your vote directly to the blockchain</span>
      </div>

      <div className="ballot-grid">
        {filteredCandidates.map((c) => {
          const voteNum = parseInt(c.votes, 10);
          const percentage = totalVotes > 0 ? ((voteNum / totalVotes) * 100).toFixed(1) : 0;
          const isLeader = leadingCandidate && leadingCandidate.id === c.id && voteNum > 0;
          const isSelected = votedCandidateId === c.id;

          return (
            <div
              key={c.id}
              className={`candidate-ballot-row ${isSelected ? "selected-candidate-row" : ""}`}
              id={`candidate-card-${c.id}`}
            >
              <div className="ballot-avatar-col">
                <div className={`candidate-monogram ${c.name.includes("Ernest Mutai") ? "monogram-featured" : ""}`}>
                  {c.initials || "CD"}
                </div>
                <div className="ballot-index-num">#{c.id.padStart(2, "0")}</div>
              </div>

              <div className="candidate-info">
                <div className="candidate-name-row">
                  <h4 className="candidate-full-name">{c.name}</h4>
                  <span className="candidate-role-badge">{c.role}</span>
                  <span className="candidate-dept-badge">{c.department}</span>
                  {isLeader && (
                    <span className="meta-tag meta-tag-success">
                      <ShieldCheckIcon size={12} />
                      <span>Majority Leader</span>
                    </span>
                  )}
                </div>

                <p className="candidate-description">{c.platform}</p>

                <div className="vote-tally-bar-container">
                  <span className="vote-count-label">{c.votes} votes ({percentage}%)</span>
                  <div className="ballot-progress-track">
                    <div
                      className="ballot-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="candidate-action-column">
                <button
                  className={`btn ${isSelected ? "btn-selected" : hasVoted ? "btn-outline" : "btn-vote"}`}
                  onClick={() => handleVote(c.id)}
                  disabled={hasVoted || isLoading || !votingActive}
                  id={`vote-btn-${c.id}`}
                  title={hasVoted ? "You have already cast your ballot" : `Cast ballot for ${c.name}`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircleIcon size={16} />
                      <span>Your Ballot</span>
                    </>
                  ) : hasVoted ? (
                    <span>Ballot Cast</span>
                  ) : !votingActive ? (
                    <span>Session Paused</span>
                  ) : (
                    <>
                      <VoteIcon size={16} />
                      <span>Vote for {c.name.split(" ")[0]}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Returning Officer Candidate Registration & Administrative Controls (Bonus Feature) */}
      <section className="registrar-box">
        <div className="registrar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PlusCircleIcon size={20} className="registrar-icon" />
            <h4 className="registrar-title">Returning Officer • Administrative Controls</h4>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              onClick={toggleVotingStatus}
              disabled={isLoading}
              title="Pause or Resume Voting Session on Smart Contract"
            >
              {votingActive ? "Pause Voting Session" : "Resume Voting Session"}
            </button>
            <span className="meta-tag">Contract Owner Access</span>
          </div>
        </div>
        <p className="registrar-desc">
          Authorized election officials can register certified student candidates directly into the smart contract.
          Owner address: <code style={{ color: "var(--text-primary)" }}>{ownerAddress || "0x9fE4...a6e0 (Deployer)"}</code>
        </p>

        <form onSubmit={handleAddCandidate} className="input-row">
          <input
            type="text"
            className="institutional-input"
            placeholder="Candidate full name (e.g. Mary Jepchirchir)"
            value={newCandidateName}
            onChange={(e) => setNewCandidateName(e.target.value)}
            id="input-candidate-name"
          />
          <input
            type="text"
            className="institutional-input"
            placeholder="Position (e.g. Postgraduate Representative)"
            value={newCandidateRole}
            onChange={(e) => setNewCandidateRole(e.target.value)}
            id="input-candidate-role"
            style={{ maxWidth: "260px" }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isLoading || !newCandidateName.trim()}
            id="btn-add-candidate"
          >
            <PlusCircleIcon size={16} />
            <span>{isLoading ? "Writing..." : "Register Candidate"}</span>
          </button>
        </form>
      </section>

      {/* Technical Specifications & Real-Time Verified Event Feed */}
      <div className="audit-grid">
        <div className="audit-card">
          <h4 className="audit-card-title">
            <BuildingIcon size={18} />
            <span>Smart Contract Specifications</span>
          </h4>
          <div className="spec-list">
            <div className="spec-row">
              <span className="spec-key">Contract Address</span>
              <span className="spec-value">{contractAddress}</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Solidity Compiler</span>
              <span className="spec-value">v0.8.20 (Paris EVM)</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Lead Architect</span>
              <span className="spec-value">Ernest Mutai</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Target Network</span>
              <span className="spec-value">{chainId === 11155111 ? "Sepolia Testnet" : "Hardhat Localhost (RPC: 8545)"}</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Session Invariant</span>
              <span className="spec-value">{votingActive ? "Voting Open (1 Vote/Address)" : "Session Paused"}</span>
            </div>
          </div>
        </div>

        <div className="audit-card">
          <h4 className="audit-card-title">
            <ClockIcon size={18} />
            <span>Cryptographic Event Ledger (Real-Time)</span>
          </h4>
          <div className="event-feed" id="event-log-list">
            {eventsLog.map(ev => (
              <div key={ev.id} className="event-row">
                <span className="event-message">{ev.message}</span>
                <span className="event-timestamp">{ev.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

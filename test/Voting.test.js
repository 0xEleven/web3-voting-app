const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract — School Capstone by Ernest Mutai", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Initialization & Lead Candidate", function () {
    it("Should set the deployer as owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should initialize with candidate Ernest Mutai and total 6 nominees", async function () {
      const count = await voting.candidatesCount();
      expect(count).to.equal(6n);

      const candidate1 = await voting.candidates(1);
      expect(candidate1.id).to.equal(1n);
      expect(candidate1.name).to.equal("Ernest Mutai");
      expect(candidate1.voteCount).to.equal(0n);

      const candidate2 = await voting.candidates(2);
      expect(candidate2.name).to.equal("Ernest Mutai (Academic Chair)");
    });

    it("Should initialize with voting active by default", async function () {
      expect(await voting.votingActive()).to.equal(true);
    });
  });

  describe("Voting Mechanics & Cryptographic Enforcement", function () {
    it("Should allow voter1 to cast a vote for Ernest Mutai", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "Voted")
        .withArgs(1n, voter1.address);

      const candidate1 = await voting.candidates(1);
      expect(candidate1.voteCount).to.equal(1n);
      expect(await voting.hasVoted(voter1.address)).to.equal(true);
      expect(await voting.getTotalVotes()).to.equal(1n);
    });

    it("Should prevent a voter from casting multiple ballots", async function () {
      await voting.connect(voter1).vote(1);
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith("Already voted!");
      await expect(voting.connect(voter1).vote(2)).to.be.revertedWith("Already voted!");
    });

    it("Should prevent voting for invalid candidate IDs", async function () {
      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Invalid candidate");
      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith("Invalid candidate");
    });
  });

  describe("Administrative Controls (Bonus Features)", function () {
    it("Should allow owner to add a new candidate", async function () {
      await expect(voting.connect(owner).addCandidate("Mercy Jerop"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(7n, "Mercy Jerop");

      const count = await voting.candidatesCount();
      expect(count).to.equal(7n);

      const candidate7 = await voting.candidates(7);
      expect(candidate7.name).to.equal("Mercy Jerop");
    });

    it("Should prevent non-owners from adding candidates", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Unauthorized Candidate")
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should reject empty candidate names", async function () {
      await expect(
        voting.connect(owner).addCandidate("")
      ).to.be.revertedWith("Candidate name cannot be empty");
    });

    it("Should allow owner to pause and resume voting session", async function () {
      // Pause voting
      await expect(voting.connect(owner).setVotingStatus(false))
        .to.emit(voting, "VotingStatusChanged")
        .withArgs(false);

      expect(await voting.votingActive()).to.equal(false);

      // Attempted vote should revert
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "Voting session is currently closed"
      );

      // Resume voting
      await voting.connect(owner).setVotingStatus(true);
      expect(await voting.votingActive()).to.equal(true);

      // Vote should succeed now
      await expect(voting.connect(voter1).vote(1)).to.emit(voting, "Voted");
    });

    it("Should prevent non-owners from changing voting status", async function () {
      await expect(
        voting.connect(voter1).setVotingStatus(false)
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("Telemetry & Queries", function () {
    it("Should correctly return candidate details via getCandidate", async function () {
      const [id, name, votes] = await voting.getCandidate(1);
      expect(id).to.equal(1n);
      expect(name).to.equal("Ernest Mutai");
      expect(votes).to.equal(0n);
    });

    it("Should accurately track total votes across multiple candidates", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(3);

      expect(await voting.getTotalVotes()).to.equal(3n);
      const cand1 = await voting.candidates(1);
      const cand3 = await voting.candidates(3);
      expect(cand1.voteCount).to.equal(2n);
      expect(cand3.voteCount).to.equal(1n);
    });
  });
});

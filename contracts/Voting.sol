// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting Smart Contract
 * @dev School Project by Ernest Mutai
 * @notice Implements Lesson 10 Architecture with administrative controls,
 *         cryptographic single-vote enforcement, and real-time events.
 */
contract Voting {
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

    event Voted(uint indexed candidateId, address indexed voter);
    event CandidateAdded(uint indexed candidateId, string name);
    event VotingStatusChanged(bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
        _addCandidate("Ernest Mutai");
        _addCandidate("Ernest Mutai (Academic Chair)");
        _addCandidate("Brenda Chelangat");
        _addCandidate("Kevin Kiprop");
        _addCandidate("Faith Wanjiku");
        _addCandidate("David Ochieng");
    }

    function _addCandidate(string memory _name) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount,
            _name,
            0
        );
        emit CandidateAdded(candidatesCount, _name);
    }

    function addCandidate(string memory _name) public onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        _addCandidate(_name);
    }

    function setVotingStatus(bool _active) public onlyOwner {
        votingActive = _active;
        emit VotingStatusChanged(_active);
    }

    function vote(uint _candidateId) public {
        require(votingActive, "Voting session is currently closed");
        require(!hasVoted[msg.sender], "Already voted!");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(_candidateId, msg.sender);
    }

    function getCandidate(uint _candidateId) public view returns (uint id, string memory name, uint voteCount) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getTotalVotes() public view returns (uint) {
        uint total = 0;
        for (uint i = 1; i <= candidatesCount; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }
}

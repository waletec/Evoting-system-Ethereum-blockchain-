// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoteCC {
    mapping(string => string) private votes;   // voter -> candidate
    mapping(string => uint) private results;   // candidate -> vote count
    string[] public candidates;
    string[] private voters;  // keep track of all voters for reset

    constructor(string[] memory _candidates) {
        candidates = _candidates;
        for(uint i=0; i < _candidates.length; i++){
            results[_candidates[i]] = 0;
        }
    }

    function castVote(string memory voter, string memory candidate) public {
        require(bytes(votes[voter]).length == 0, "Voter has already voted");
        votes[voter] = candidate;
        results[candidate] += 1;
        voters.push(voter);
    }

    function getVote(string memory voter) public view returns (string memory) {
        return votes[voter];
    }

    function getResults() public view returns (uint[] memory) {
        uint[] memory res = new uint[](candidates.length);
        for(uint i = 0; i < candidates.length; i++){
            res[i] = results[candidates[i]];
        }
        return res;
    }

    function getCandidates() public view returns (string[] memory){
        return candidates;
    }

    /// @notice Reset election: clears votes and results for all candidates
    function resetElection() public {
        // Reset results
        for(uint i=0; i < candidates.length; i++){
            results[candidates[i]] = 0;
        }

        // Clear all votes
        for(uint j=0; j < voters.length; j++){
            delete votes[voters[j]];
        }

        // Reset voters array
        delete voters;
    }
}

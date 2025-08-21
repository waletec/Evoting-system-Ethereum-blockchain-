const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers } = hre;

  // Get the deployed contract address from deployment info
  const deploymentPath = path.join(process.cwd(), "deployments", "localhost.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentInfo.address;

  // Get contract factory and attach
  const VoteCC = await ethers.getContractFactory("VoteCC");
  const vote = await VoteCC.attach(contractAddress);

  console.log("\nContract address:", contractAddress);
  
  // Verify contract deployment
  const code = await ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error("Contract not deployed at this address!");
  }
  console.log("Contract verified at address");

  // Get test accounts
  const accounts = await ethers.getSigners();
  console.log("Test accounts:");
  accounts.forEach((acc, idx) => console.log(`${idx}: ${acc.address}`));

  // Get candidates
  const candidates = await vote.getCandidates();
  console.log("\nCandidates:", candidates);

  // Cast votes
  console.log("\nCasting votes...");
  await vote.connect(accounts[0]).castVote("voter1", "Alice");
  await vote.connect(accounts[1]).castVote("voter2", "Bob");
  await vote.connect(accounts[2]).castVote("voter3", "Alice");
  console.log("Votes cast successfully!");

  // Retrieve each voter's vote
  console.log("\nVoter choices:");
  for (let i = 1; i <= 3; i++) {
    const voteResult = await vote.getVote(`voter${i}`);
    console.log(`voter${i}: ${voteResult}`);
  }

  // Get voting results
  const results = await vote.getResults();
  const formattedResults = results.map((r, i) => ({
    candidate: candidates[i],
    votes: r.toString(),
  }));
  console.log("\nElection results:", formattedResults);

  // Reset election
  console.log("\nResetting election...");
  await vote.resetElection();
  console.log("Election reset complete!");

  // Verify reset
  const resultsAfterReset = await vote.getResults();
  const formattedAfterReset = resultsAfterReset.map((r, i) => ({
    candidate: candidates[i],
    votes: r.toString(),
  }));
  console.log("\nResults after reset:", formattedAfterReset);

  for (let i = 1; i <= 3; i++) {
    const voteAfterReset = await vote.getVote(`voter${i}`);
    console.log(`voter${i} vote after reset: "${voteAfterReset}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error testing contract:", error);
    process.exit(1);
  });

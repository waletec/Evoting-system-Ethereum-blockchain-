const hre = require("hardhat");

async function main() {
  try {
    console.log("🚀 Testing contract deployment without ETH...");
    
    const network = hre.network;
    const { ethers } = hre;
    const provider = new ethers.JsonRpcProvider(network.config.url);
    
    console.log("🔗 Network:", network.name);
    console.log("🔗 Chain ID:", network.config.chainId);
    
    // Get account info
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length === 0) {
      console.log("❌ No accounts available");
      return;
    }
    
    const account = accounts[0];
    const balance = await provider.getBalance(account);
    console.log("👤 Account:", account);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    
    // Try to deploy the contract
    console.log("\n🚀 Attempting to deploy VoteCC contract...");
    
    try {
      // Get contract factory
      const VoteCC = await hre.ethers.getContractFactory("VoteCC");
      console.log("✅ Contract factory created");
      
      // Prepare deployment - pass candidates as an array
      const candidates = ["Alice", "Bob", "Charlie"];
      console.log("👥 Deploying with candidates:", candidates);
      
      // Try to deploy (this will fail if we need ETH, but let's see exactly how)
      const vote = await VoteCC.deploy(candidates);
      console.log("🎉 Contract deployment initiated!");
      
      // Wait for deployment
      await vote.waitForDeployment();
      const contractAddress = await vote.getAddress();
      console.log("✅ Contract deployed successfully to:", contractAddress);
      
      console.log("\n🎉 SUCCESS! You can deploy contracts without ETH!");
      console.log("💡 Your current setup works fine as-is");
      
    } catch (deployError) {
      console.log("❌ Deployment failed:", deployError.message);
      
      // Check what type of error this is
      if (deployError.message.includes("insufficient funds")) {
        console.log("\n💡 This confirms you need ETH for gas fees");
        console.log("💰 You need to either:");
        console.log("   1. Mine some ETH on your private network");
        console.log("   2. Configure Geth for free transactions");
        console.log("   3. Use a faucet");
      } else if (deployError.message.includes("nonce")) {
        console.log("\n💡 Nonce error - might need to reset account");
      } else if (deployError.message.includes("gas")) {
        console.log("\n💡 Gas-related error - might need ETH");
      } else {
        console.log("\n💡 Other error - need to investigate further");
        console.log("🔍 Error details:", deployError);
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

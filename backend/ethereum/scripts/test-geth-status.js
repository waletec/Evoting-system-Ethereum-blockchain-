const hre = require("hardhat");

async function main() {
  try {
    console.log("🔌 Testing Geth node status on Ubuntu server...");
    console.log("📡 Server: 206.81.24.9:8545");
    
    const network = hre.network;
    const { ethers } = hre;
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(network.config.url);
    console.log("🔗 Provider created successfully");
    
    // Test various RPC calls
    console.log("\n📊 Testing RPC endpoints...");
    
    try {
      // Get block number
      const blockNumber = await provider.getBlockNumber();
      console.log("📦 Latest Block:", blockNumber);
      
      // Get network info
      const networkInfo = await provider.getNetwork();
      console.log("🔗 Chain ID:", networkInfo.chainId.toString());
      
      // Get gas price
      const gasPrice = await provider.getFeeData();
      console.log("⛽ Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
      
      // Get accounts (if any)
      try {
        const accounts = await provider.send("eth_accounts", []);
        console.log("👤 Available accounts:", accounts.length);
        if (accounts.length > 0) {
          console.log("   First account:", accounts[0]);
          
          // Get balance
          const balance = await provider.getBalance(accounts[0]);
          console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
        }
      } catch (accountsError) {
        console.log("⚠️  Could not get accounts:", accountsError.message);
      }
      
      // Test mining status
      try {
        const mining = await provider.send("eth_mining", []);
        console.log("⛏️  Mining:", mining ? "Yes" : "No");
      } catch (miningError) {
        console.log("⚠️  Could not get mining status:", miningError.message);
      }
      
      // Test syncing status
      try {
        const syncing = await provider.send("eth_syncing", []);
        if (syncing) {
          console.log("🔄 Syncing:", "Yes");
          console.log("   Current block:", syncing.currentBlock);
          console.log("   Highest block:", syncing.highestBlock);
        } else {
          console.log("🔄 Syncing:", "No (fully synced)");
        }
      } catch (syncingError) {
        console.log("⚠️  Could not get syncing status:", syncingError.message);
      }
      
      console.log("\n✅ Geth status test completed!");
      
    } catch (rpcError) {
      console.log("⚠️  RPC call failed:", rpcError.message);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("🔍 Error details:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

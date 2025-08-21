const hre = require("hardhat");

async function main() {
  try {
    console.log("🔌 Testing connection to remote Ethereum node...");
    
    // Get the provider for the remote network
    const provider = hre.ethers.provider;
    
    // Test basic connection
    console.log("📡 Network URL:", provider.connection.url);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log("🔗 Chain ID:", network.chainId.toString());
    
    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log("📦 Latest Block:", latestBlock);
    
    // Get gas price
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Gas Price:", hre.ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    // Get accounts if available
    const accounts = await hre.ethers.getSigners();
    if (accounts.length > 0) {
      console.log("👤 Connected Account:", accounts[0].address);
      const balance = await provider.getBalance(accounts[0].address);
      console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");
    } else {
      console.log("⚠️  No accounts available (check PRIVATE_KEY in .env)");
    }
    
    console.log("✅ Connection test completed successfully!");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

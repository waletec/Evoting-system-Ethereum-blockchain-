const hre = require("hardhat");

async function main() {
  try {
    console.log("🔌 Testing basic connection to remote Ethereum node...");
    console.log("📡 Server: 206.81.24.9:8545");
    
    // Get the provider for the remote network
    const { ethers } = hre;
    const provider = ethers.provider;
    
    // Test basic connection
    console.log("🔗 Network URL:", provider.connection.url);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log("🔗 Chain ID:", network.chainId.toString());
    
    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log("📦 Latest Block:", latestBlock);
    
    // Get gas price
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    console.log("✅ Basic connection test completed successfully!");
    console.log("💡 Next step: Add your private key to .env and run npm run test-connection");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    console.log("🔍 Troubleshooting tips:");
    console.log("1. Make sure your Ubuntu server is running Geth on port 8545");
    console.log("2. Check if port 8545 is open in your firewall");
    console.log("3. Verify Geth is configured to accept external connections");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

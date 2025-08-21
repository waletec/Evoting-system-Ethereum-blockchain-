const hre = require("hardhat");

async function main() {
  try {
    console.log("🔌 Simple connection test to remote Ethereum node...");
    console.log("📡 Server: 206.81.24.9:8545");
    
    // Try to get the network configuration
    const network = hre.network;
    console.log("🔗 Network name:", network.name);
    console.log("🔗 Network config:", network.config);
    
    // Try to get provider - in Hardhat v6, we need to create it differently
    try {
      const { ethers } = hre;
      console.log("✅ Ethers found");
      
      // Try to create a provider manually
      const provider = new ethers.JsonRpcProvider(network.config.url);
      console.log("🔗 Provider created successfully");
      
      // Test basic connection
      const blockNumber = await provider.getBlockNumber();
      console.log("📦 Latest Block:", blockNumber);
      
      // Get network info
      const networkInfo = await provider.getNetwork();
      console.log("🔗 Chain ID:", networkInfo.chainId.toString());
      
      console.log("✅ Connection test successful!");
      
    } catch (providerError) {
      console.log("⚠️  Provider creation failed:", providerError.message);
    }
    
    console.log("✅ Simple test completed!");
    
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

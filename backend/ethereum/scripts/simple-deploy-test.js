const hre = require("hardhat");

async function main() {
  try {
    console.log("🧪 Simple deployment test...");
    
    // Check if we can compile
    console.log("📦 Compiling contracts...");
    await hre.run("compile");
    console.log("✅ Contracts compiled");
    
    // Check if we can get the contract factory
    console.log("🏭 Getting contract factory...");
    const VoteCC = await hre.ethers.getContractFactory("VoteCC");
    console.log("✅ Contract factory created");
    
    // Check the constructor parameters
    console.log("🔍 Checking constructor...");
    const constructorFragment = VoteCC.interface.deploy;
    console.log("📋 Constructor fragment:", constructorFragment);
    
    // Check if we can encode the deployment
    console.log("🔧 Encoding deployment...");
    const candidates = ["Alice", "Bob", "Charlie"];
    const deploymentData = VoteCC.interface.encodeDeploy([candidates]);
    console.log("✅ Deployment data encoded");
    console.log("📏 Data length:", deploymentData.length);
    
    console.log("\n🎯 Contract is ready for deployment!");
    console.log("💡 The issue might be with the network configuration");
    console.log("💡 Try using the 'remote' network instead of 'remote-readonly'");
    
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

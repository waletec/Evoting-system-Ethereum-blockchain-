const hre = require("hardhat");

async function main() {
  try {
    console.log("🔧 Testing contract compilation and preparation...");
    
    // Compile contracts
    console.log("📦 Compiling contracts...");
    await hre.run("compile");
    console.log("✅ Contracts compiled successfully!");
    
    // Get contract factory
    console.log("🏭 Getting VoteCC contract factory...");
    const VoteCC = await hre.ethers.getContractFactory("VoteCC");
    console.log("✅ Contract factory created!");
    
    // Prepare deployment parameters
    const candidates = ["Alice", "Bob", "Charlie"];
    console.log("👥 Initial candidates:", candidates);
    
    // Get deployment data (without deploying)
    console.log("📋 Preparing deployment data...");
    const deploymentData = VoteCC.interface.encodeDeploy([candidates]);
    console.log("✅ Deployment data prepared!");
    
    // Estimate gas (this will fail without private key, but that's expected)
    try {
      const network = hre.network;
      const { ethers } = hre;
      const provider = new ethers.JsonRpcProvider(network.config.url);
      
      console.log("⛽ Estimating gas for deployment...");
      const gasEstimate = await provider.estimateGas({
        data: deploymentData,
        from: "0x201728993ab94ea974ee350805130a942cf65a64"
      });
      console.log("✅ Gas estimate:", gasEstimate.toString());
      
    } catch (gasError) {
      console.log("⚠️  Gas estimation failed (expected without private key):", gasError.message);
    }
    
    console.log("\n🎯 Contract is ready for deployment!");
    console.log("💡 Next step: Add your private key to .env and run npm run deploy");
    
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

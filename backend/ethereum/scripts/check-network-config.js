const hre = require("hardhat");

async function main() {
  try {
    console.log("🔍 Checking network configuration for free transactions...");
    
    const network = hre.network;
    const { ethers } = hre;
    const provider = new ethers.JsonRpcProvider(network.config.url);
    
    console.log("🔗 Network:", network.name);
    console.log("🔗 URL:", network.config.url);
    console.log("🔗 Chain ID:", network.config.chainId);
    
    // Check if this is a private network
    if (network.config.chainId === 0) {
      console.log("✅ This appears to be a private test network!");
      console.log("💡 Private networks can be configured for free transactions");
    }
    
    // Test if we can get gas price
    try {
      const gasPrice = await provider.getFeeData();
      console.log("⛽ Current Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
      
      if (gasPrice.gasPrice === 0n) {
        console.log("🎉 Gas price is 0 - transactions are FREE!");
      } else if (ethers.formatUnits(gasPrice.gasPrice, "gwei") < "0.001") {
        console.log("💰 Gas price is very low - almost free transactions");
      } else {
        console.log("⚠️  Gas price is significant - may need ETH");
      }
    } catch (error) {
      console.log("⚠️  Could not get gas price:", error.message);
    }
    
    // Check account balance
    try {
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const balance = await provider.getBalance(accounts[0]);
        console.log("👤 Account:", accounts[0]);
        console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
        
        if (balance > 0n) {
          console.log("✅ Account has ETH for gas fees");
        } else {
          console.log("⚠️  Account has no ETH - but this might be fine for private networks");
        }
      }
    } catch (error) {
      console.log("⚠️  Could not check account balance:", error.message);
    }
    
    console.log("\n💡 Recommendations:");
    if (network.config.chainId === 0) {
      console.log("1. This is a private network - configure for free transactions");
      console.log("2. Set gas price to 0 in your Geth configuration");
      console.log("3. No real ETH needed for development/testing");
    } else {
      console.log("1. Consider using a testnet for development");
      console.log("2. Use faucets to get test ETH");
      console.log("3. Keep costs minimal during development");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

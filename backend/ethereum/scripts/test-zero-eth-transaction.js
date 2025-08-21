const hre = require("hardhat");

async function main() {
  try {
    console.log("🧪 Testing if transactions work with 0 ETH balance...");
    
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
    
    // Try to estimate gas for a simple transaction
    console.log("\n🧪 Testing gas estimation...");
    try {
      // Create a simple transaction (sending 0 ETH to yourself)
      const tx = {
        from: account,
        to: account,
        value: 0,
        data: "0x" // Empty data
      };
      
      const gasEstimate = await provider.estimateGas(tx);
      console.log("✅ Gas estimation successful:", gasEstimate.toString());
      
      // Check if we can actually send this transaction
      console.log("\n🧪 Testing if transaction can be sent...");
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      console.log("⛽ Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
      
      // Calculate total cost
      const totalCost = gasEstimate * gasPrice;
      console.log("💸 Total Transaction Cost:", ethers.formatEther(totalCost), "ETH");
      
      if (balance >= totalCost) {
        console.log("✅ Account has enough ETH for this transaction");
      } else {
        console.log("⚠️  Account doesn't have enough ETH for this transaction");
        console.log("💡 But this might still work on private networks!");
        
        // Try to send a transaction anyway (it might work on private networks)
        console.log("\n🚀 Attempting to send transaction anyway...");
        try {
          // This will likely fail, but let's see the exact error
          const txResponse = await provider.send("eth_sendTransaction", [tx]);
          console.log("🎉 Transaction sent successfully:", txResponse);
        } catch (sendError) {
          console.log("❌ Transaction failed as expected:", sendError.message);
          
          if (sendError.message.includes("insufficient funds")) {
            console.log("\n💡 This confirms you need ETH for gas fees");
            console.log("💡 Options:");
            console.log("   1. Mine some ETH on your private network");
            console.log("   2. Configure Geth for free transactions");
            console.log("   3. Use a faucet if available");
          }
        }
      }
      
    } catch (error) {
      console.log("❌ Gas estimation failed:", error.message);
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

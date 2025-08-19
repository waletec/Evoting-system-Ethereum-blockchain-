const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function testWithoutContract() {
  console.log('🔄 Testing without contract name...');
  try {
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    // Try without contract name (uses default contract)
    const contract = network.getContract('votecc');
    console.log('✅ Contract instance created (no contract name)');
    
    console.log('📝 Testing allVotes...');
    const result = await contract.evaluateTransaction('allVotes');
    console.log(`🎉 SUCCESS: ${result.toString()}`);

  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('Full error:', error);
  }
}

testWithoutContract();
const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function testBlockchainConnection() {
  try {
    console.log('🔄 Testing connection to DigitalOcean blockchain...');
    
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    const contract = network.getContract('votecc', 'VotingContract');
    console.log('✅ Contract instance created');
    
    // Test getAllVotes function
    console.log('🔄 Testing allVotes...');
    const result = await contract.evaluateTransaction('allVotes');
    console.log('✅ allVotes successful!');
    console.log('📊 Result:', result.toString());
    
    // Test InitLedger if needed
    console.log('🔄 Testing InitLedger...');
    try {
      await contract.submitTransaction('InitLedger');
      console.log('✅ InitLedger successful!');
    } catch (e) {
      console.log('ℹ️  InitLedger skipped (might already be initialized)');
    }
    
    console.log('🎉 Blockchain connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Blockchain test failed:', error.message);
    console.error('Details:', error.stack?.split('\n')[0]);
  }
}

// Set environment variables
process.env.FABRIC_DISCOVERY_ENABLED = 'false';
process.env.FABRIC_AS_LOCALHOST = 'false';

testBlockchainConnection();
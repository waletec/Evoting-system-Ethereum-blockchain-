const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function testSimpleConnection() {
  console.log('🔄 Testing simple connection to DigitalOcean blockchain...');
  try {
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    // Try without specifying contract name first
    const contract = network.getContract('votecc');
    console.log('✅ Contract instance created (no contract name)');
    
    // Test a simple query
    console.log('🔄 Testing basic query...');
    const result = await contract.evaluateTransaction('allVotes');
    console.log(`🎉 Query successful: ${result.toString()}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try with contract name
    try {
      console.log('🔄 Trying with VotingContract...');
      const network = await connectToNetwork();
      const contract = network.getContract('votecc', 'VotingContract');
      const result = await contract.evaluateTransaction('allVotes');
      console.log(`🎉 With contract name successful: ${result.toString()}`);
    } catch (error2) {
      console.error('❌ Both attempts failed:', error2.message);
    }
  }
}

testSimpleConnection();
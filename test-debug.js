const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function debugConnection() {
  console.log('🔄 Debug: Testing connection to DigitalOcean blockchain...');
  try {
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    // Try 1: Without contract name
    console.log('\n📝 Test 1: Without contract name');
    try {
      const contract = network.getContract('votecc');
      console.log('✅ Contract instance created (no contract name)');
      const result = await contract.evaluateTransaction('allVotes');
      console.log(`🎉 SUCCESS: ${result.toString()}`);
      return;
    } catch (error) {
      console.log(`❌ Failed without contract name: ${error.message}`);
    }
    
    // Try 2: With VotingContract
    console.log('\n📝 Test 2: With VotingContract');
    try {
      const contract = network.getContract('votecc', 'VotingContract');
      const result = await contract.evaluateTransaction('allVotes');
      console.log(`🎉 SUCCESS: ${result.toString()}`);
      return;
    } catch (error) {
      console.log(`❌ Failed with VotingContract: ${error.message}`);
    }
    
    // Try 3: Different function name
    console.log('\n📝 Test 3: Trying getAllVotes function');
    try {
      const contract = network.getContract('votecc');
      const result = await contract.evaluateTransaction('getAllVotes');
      console.log(`🎉 SUCCESS: ${result.toString()}`);
      return;
    } catch (error) {
      console.log(`❌ Failed with getAllVotes: ${error.message}`);
    }
    
    // Try 4: Check if chaincode is committed
    console.log('\n📝 Test 4: Checking channel info');
    try {
      const channel = network.getChannel();
      console.log(`✅ Channel name: ${channel.getName()}`);
    } catch (error) {
      console.log(`❌ Channel error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

debugConnection();
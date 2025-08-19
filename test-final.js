const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function testFinalConnection() {
  console.log('🔄 Testing final connection with correct function names...');
  try {
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    const contract = network.getContract('votecc', 'VotingContract');
    console.log('✅ Contract instance created');
    
    // Test 1: allVotes (read-only)
    console.log('\n📝 Test 1: allVotes');
    try {
      const result = await contract.evaluateTransaction('allVotes');
      console.log(`🎉 allVotes SUCCESS: ${result.toString()}`);
    } catch (error) {
      console.log(`❌ allVotes failed: ${error.message}`);
    }
    
    // Test 2: initLedger (if needed)
    console.log('\n📝 Test 2: initLedger');
    try {
      await contract.submitTransaction('initLedger');
      console.log('🎉 initLedger SUCCESS');
    } catch (error) {
      console.log(`❌ initLedger failed: ${error.message}`);
    }
    
    // Test 3: allVotes again (to see initialized data)
    console.log('\n📝 Test 3: allVotes after init');
    try {
      const result = await contract.evaluateTransaction('allVotes');
      console.log(`🎉 allVotes after init: ${result.toString()}`);
    } catch (error) {
      console.log(`❌ allVotes after init failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testFinalConnection();
const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function initializeLedger() {
  try {
    console.log('🔄 Initializing voting ledger...');
    
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    const contract = network.getContract('voting_1', 'VotingContract');
    console.log('✅ Contract instance created');
    
    // Try to submit InitLedger transaction to start the chaincode container
    console.log('🔄 Submitting InitLedger transaction...');
    const result = await contract.submitTransaction('InitLedger');
    console.log('✅ InitLedger successful!');
    console.log('📊 Result:', result.toString());
    
    // Now try getAllVotes
    console.log('🔄 Testing getAllVotes after initialization...');
    const votesResult = await contract.evaluateTransaction('getAllVotes');
    console.log('✅ getAllVotes successful!');
    console.log('📊 Votes:', votesResult.toString());
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('Details:', error.stack?.split('\n')[0]);
  }
}

// Set environment variables
process.env.FABRIC_DISCOVERY_ENABLED = 'false';
process.env.FABRIC_AS_LOCALHOST = 'false';

initializeLedger();
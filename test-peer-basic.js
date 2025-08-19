const { connectToNetwork } = require('./backend/blockchain/fabricUtils');

async function testBasicPeerConnection() {
  try {
    console.log('🔄 Testing basic peer connection...');
    
    const network = await connectToNetwork();
    console.log('✅ Network connection established');
    
    // Try to get channel info (this should work even without chaincode)
    try {
      const channel = network.getChannel();
      console.log('✅ Channel object obtained:', channel.getName());
    } catch (e) {
      console.log('❌ Channel error:', e.message);
    }
    
    // Try to get peer info
    try {
      const contract = network.getContract('_lifecycle');
      const result = await contract.evaluateTransaction('QueryInstalledChaincodes');
      console.log('✅ Lifecycle query successful');
      console.log('📊 Installed chaincodes:', result.toString());
    } catch (e) {
      console.log('❌ Lifecycle query failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Basic test failed:', error.message);
  }
}

// Set environment variables
process.env.FABRIC_DISCOVERY_ENABLED = 'false';
process.env.FABRIC_AS_LOCALHOST = 'false';

testBasicPeerConnection();
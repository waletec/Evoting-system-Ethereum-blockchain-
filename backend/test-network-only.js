const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function testNetworkConnection() {
    try {
        console.log('🔍 Testing network connection only...');
        
        const ccpPath = path.resolve(__dirname, 'connection.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: false, asLocalhost: false }
        });
        
        console.log('✅ Gateway connected successfully');
        
        const network = await gateway.getNetwork('mychannel');
        console.log('✅ Network obtained successfully');
        
        // Try to get channel info without invoking chaincode
        const channel = network.getChannel();
        console.log('✅ Channel obtained:', channel.getName());
        
        await gateway.disconnect();
        console.log('✅ All connection tests passed');
        
    } catch (error) {
        console.error('❌ Network connection error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testNetworkConnection();
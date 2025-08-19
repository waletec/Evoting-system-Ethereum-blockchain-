const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function debugConnection() {
    try {
        console.log('🔍 Loading connection profile...');
        const ccpPath = path.resolve(__dirname, 'connection.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        console.log('🔍 Loading wallet...');
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        console.log('🔍 Checking identity...');
        const identity = await wallet.get('appUser');
        if (!identity) {
            throw new Error('Identity appUser not found');
        }
        
        console.log('🔍 Creating gateway...');
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: false, asLocalhost: false }
        });
        
        console.log('🔍 Getting network...');
        const network = await gateway.getNetwork('mychannel');
        
        console.log('🔍 Getting contract...');
        const contract = network.getContract('votecc');
        
        console.log('🔍 Testing peer connectivity first...');
        
        // Test simple query first
        try {
            console.log('🔍 Trying evaluateTransaction...');
            const result = await contract.evaluateTransaction('allVotes');
            console.log('✅ Evaluate SUCCESS:', result.toString());
        } catch (evalError) {
            console.log('❌ Evaluate failed, trying submit...');
            console.log('Eval error:', evalError.message);
        }
        
        console.log('🔍 Submitting transaction...');
        const result = await contract.submitTransaction('allVotes');
        
        console.log('✅ SUCCESS:', result.toString());
        
    } catch (error) {
        console.error('❌ DETAILED ERROR:');
        console.error('Message:', error.message);
        console.error('Type:', error.constructor.name);
        
        if (error.responses) {
            console.error('Responses:', JSON.stringify(error.responses, null, 2));
        }
        if (error.errors) {
            console.error('Errors:', JSON.stringify(error.errors, null, 2));
        }
        if (error.endorsements) {
            console.error('Endorsements:', JSON.stringify(error.endorsements, null, 2));
        }
        
        console.error('Full error object keys:', Object.keys(error));
        console.error('Full Stack:', error.stack);
    }
}

debugConnection();
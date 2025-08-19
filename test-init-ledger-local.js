const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function initializeLedger() {
  console.log('🔄 Initializing voting ledger...');
  try {
    const ccpPath = path.resolve(__dirname, 'backend', 'connection.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(__dirname, 'backend', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
      throw new Error('Admin identity not found in wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: false }
    });
    console.log('✅ Blockchain connection established and cached');

    const network = await gateway.getNetwork('mychannel');
    console.log('✅ Network connection established');

    const contract = network.getContract('voting_1', 'VotingContract');
    console.log('✅ Contract instance created');

    console.log('🔄 Submitting InitLedger transaction...');
    const result = await contract.submitTransaction('InitLedger');
    console.log(`🎉 InitLedger successful: ${result.toString()}`);

    // Now test getAllVotes
    console.log('🔄 Testing getAllVotes after initialization...');
    const votesResult = await contract.evaluateTransaction('getAllVotes');
    console.log('✅ getAllVotes successful!');
    console.log('Current votes:', votesResult.toString());

    await gateway.disconnect();

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('Details:', error);
  }
}

initializeLedger();
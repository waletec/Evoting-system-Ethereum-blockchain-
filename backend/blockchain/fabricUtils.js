
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', 'connection.json'); // Your network config
const walletPath = path.join(__dirname, '..', 'wallet');

async function connectToNetwork() {
  try {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
      throw new Error('Admin identity not found in wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('mychannel'); // Adjust channel name if different
    return network;
  } catch (error) {
    console.error('⚠️ Error connecting to Fabric network:', error);
    throw error;
  }
}

module.exports = {
  connectToNetwork
};

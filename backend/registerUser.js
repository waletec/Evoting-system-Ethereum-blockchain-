// backend/registerUser.js
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const ccpPath = process.env.FABRIC_CCP
  ? path.resolve(process.env.FABRIC_CCP)
  : path.resolve(__dirname, 'connection.json');

async function main() {
  try {

    const walletPath = process.env.FABRIC_WALLET
      ? path.resolve(process.env.FABRIC_WALLET)
      : path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userExists = await wallet.get('appUser');
    if (userExists) {
      console.log('✅ An identity for the user "appUser" already exists in the wallet');
      return;
    }

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('⚠️ Admin identity not found in the wallet');
      console.log('👉 Run enrollAdmin.js first');
      return;
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');




    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: mspId,
      type: 'X.509',
    };

    await wallet.put(enrollmentId, x509Identity);
    console.log(`✅ Successfully registered and enrolled "${enrollmentId}" and imported into the wallet`);

  } catch (error) {
    console.error('❌ Failed to register user "appUser":', error);
    process.exit(1);
  }
}

main(); 
// Fabric-related code removed for Ethereum migration
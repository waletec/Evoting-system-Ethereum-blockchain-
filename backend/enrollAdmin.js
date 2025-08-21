const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    // Create a new file system based wallet
    const walletPath = process.env.FABRIC_WALLET
      ? path.resolve(process.env.FABRIC_WALLET)
      : path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    // Fabric-related code removed for Ethereum migration
    // ...existing code...

    // Check if admin is already enrolled
    const identity = await wallet.get('admin');
    if (identity) {
      console.log('✅ Admin identity already exists in the wallet');
      return;
    }

    // Enroll the admin user, and import the identity into the wallet
    const enrollment = await ca.enroll({
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw'
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: mspId,
      type: 'X.509'
    };

    await wallet.put('admin', x509Identity);
    console.log('🎉 Successfully enrolled admin and imported into the wallet');

  } catch (error) {
    console.error('❌ Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin(); 
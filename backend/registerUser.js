// backend/registerUser.js
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
  try {
    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    const ca = new FabricCAServices(caURL);

    const walletPath = path.join(__dirname, 'wallet');
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

    const secret = await ca.register({
      affiliation: 'org1.department1',
      enrollmentID: 'appUser',
      role: 'client'
    }, adminUser);

    const enrollment = await ca.enroll({
      enrollmentID: 'appUser',
      enrollmentSecret: secret
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('appUser', x509Identity);
    console.log('✅ Successfully registered and enrolled "appUser" and imported into the wallet');

  } catch (error) {
    console.error('❌ Failed to register user "appUser":', error);
    process.exit(1);
  }
}

main(); 
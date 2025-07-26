// registerAdmin2.js
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
  try {
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false });

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('❌ Admin identity not found in the wallet. Run enrollAdmin.js first.');
      return;
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // Register a new identity
    await ca.register({
      enrollmentID: 'admin2',
      enrollmentSecret: 'admin2pw',
      role: 'admin',
      attrs: [{ name: 'hf.Registrar.Roles', value: 'client,user,admin' }]
    }, adminUser);

    console.log('✅ Successfully registered admin2');

  } catch (error) {
    console.error(`❌ Failed to register admin2: ${error}`);
    process.exit(1);
  }
}

main();

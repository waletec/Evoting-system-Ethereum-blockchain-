// backend/registerUser.js
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const ccpPath = process.env.FABRIC_CCP
  ? path.resolve(process.env.FABRIC_CCP)
  : path.resolve(__dirname, 'connection.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
  try {
    const defaultOrg = ccp.client && ccp.client.organization ? ccp.client.organization : Object.keys(ccp.organizations)[0];
    const orgName = process.env.FABRIC_ORG || defaultOrg;
    const mspId = process.env.FABRIC_MSPID || ccp.organizations[orgName].mspid;

    const caNameEnv = process.env.FABRIC_CA_NAME;
    const caNameAuto = Object.keys(ccp.certificateAuthorities)[0];
    const caName = caNameEnv || caNameAuto;
    const caInfo = ccp.certificateAuthorities[caName];
    const caTLSCACerts = caInfo.tlsCACerts && caInfo.tlsCACerts.pem ? caInfo.tlsCACerts.pem : undefined;
    const ca = new FabricCAServices(
      caInfo.url,
      caTLSCACerts ? { trustedRoots: caTLSCACerts, verify: false } : { verify: false },
      caInfo.caName
    );

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

    const enrollmentId = process.env.FABRIC_USER_ID || 'appUser';
    const affiliationDefault = `${orgName.toLowerCase()}.department1`;
    const affiliation = process.env.FABRIC_AFFILIATION || affiliationDefault;

    const secret = await ca.register({
      affiliation,
      enrollmentID: enrollmentId,
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
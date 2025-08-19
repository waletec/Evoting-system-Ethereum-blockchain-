const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    const ccpPath = process.env.FABRIC_CCP
      ? path.resolve(process.env.FABRIC_CCP)
      : path.resolve(__dirname, 'connection.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Determine organization and CA from CCP or env
    const defaultOrg = ccp.client && ccp.client.organization ? ccp.client.organization : Object.keys(ccp.organizations)[0];
    const orgName = process.env.FABRIC_ORG || defaultOrg;
    const mspId = process.env.FABRIC_MSPID || ccp.organizations[orgName].mspid;

    const caNameEnv = process.env.FABRIC_CA_NAME;
    const caNameAuto = Object.keys(ccp.certificateAuthorities)[0];
    const caName = caNameEnv || caNameAuto;
    const caInfo = ccp.certificateAuthorities[caName];

    // Create CA client with TLS certificates (if provided)
    const caTLSCACerts = caInfo.tlsCACerts && caInfo.tlsCACerts.pem ? caInfo.tlsCACerts.pem : undefined;
    const ca = new FabricCAServices(
      caInfo.url,
      caTLSCACerts ? { trustedRoots: caTLSCACerts, verify: false } : { verify: false },
      caInfo.caName
    );

    // Create a new file system based wallet
    const walletPath = process.env.FABRIC_WALLET
      ? path.resolve(process.env.FABRIC_WALLET)
      : path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

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
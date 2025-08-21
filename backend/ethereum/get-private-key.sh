#!/bin/bash

echo "🔑 Extracting private key from Geth keystore..."

# Install keythereum if not already installed
npm install -g keythereum

# Create the extraction script
cat > extract-key.js << 'EOF'
const fs = require("fs");
const keythereum = require("keythereum");

// You need to update these paths and password
const keystorePath = "/root/snap/geth/477/.ethereum/keystore/";
const password = ""; // Enter your password here

// List all keystore files
const keystoreFiles = fs.readdirSync(keystorePath).filter(f => f.endsWith('.json'));

if (keystoreFiles.length === 0) {
    console.log("❌ No keystore files found in:", keystorePath);
    process.exit(1);
}

console.log("📁 Found keystore files:");
keystoreFiles.forEach(f => console.log("  -", f));

// Use the first keystore file (or specify which one you want)
const keystoreFile = keystoreFiles[0];
const keystorePath = path.join(keystorePath, keystoreFile);

console.log("\n🔑 Using keystore file:", keystoreFile);

try {
    const keyObject = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
    const privateKey = keythereum.recover(password, keyObject);
    
    console.log("\n✅ Private Key extracted successfully!");
    console.log("🔑 Private Key: 0x" + privateKey.toString('hex'));
    console.log("👤 Account Address:", keyObject.address);
    console.log("\n💡 Copy the private key above to your .env file as:");
    console.log("PRIVATE_KEY=0x" + privateKey.toString('hex'));
    
} catch (error) {
    console.error("❌ Error extracting private key:", error.message);
    console.log("💡 Make sure you have the correct password and keystore path");
}
EOF

echo "📝 Extraction script created. Now run:"
echo "node extract-key.js"
echo ""
echo "⚠️  Make sure to update the password in the script first!"

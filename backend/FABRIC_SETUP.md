# Hyperledger Fabric Identity Management Guide

## Overview
This guide explains the critical Fabric identity files and their importance for blockchain operations.

## Critical Files (DO NOT DELETE)

### 1. `enrollAdmin.js` - **CRITICAL**
- **Purpose**: Creates the `admin` identity in the wallet
- **Why Critical**: `fabricUtils.js` depends on this identity for blockchain connections
- **Usage**: `npm run enroll-admin`

### 2. `registerUser.js` - **CRITICAL**
- **Purpose**: Registers user identities for blockchain operations
- **Why Critical**: Needed for user-level blockchain transactions
- **Usage**: `npm run register-user`

### 3. `registerAdmin2.js` - **Optional**
- **Purpose**: Registers additional admin identities
- **Usage**: `npm run register-admin2`

### 4. `enrollAdmin2.js` - **Optional**
- **Purpose**: Enrolls additional admin identities
- **Usage**: `npm run enroll-admin2`

## Setup Process

### Step 1: Ensure Fabric Network is Running
```bash
cd fabric-samples/test-network
./network.sh up createChannel -ca -c mychannel
```

### Step 2: Deploy Chaincode
```bash
./network.sh deployCC -ccn voting -ccp ../voting-system/fabric-samples/chaincode/voting-js -ccl javascript
```

### Step 3: Setup Identities
```bash
cd ../../voting-system/backend

# 1. Enroll the main admin (CRITICAL)
npm run enroll-admin

# 2. Register and enroll user (CRITICAL)
npm run register-user

# 3. Optional: Additional admin identities
npm run register-admin2
npm run enroll-admin2
```

## File Dependencies

### `fabricUtils.js` Dependencies:
```javascript
const identity = await wallet.get('admin'); // Requires enrollAdmin.js
```

### `voteController.js` Dependencies:
```javascript
const network = await connectToNetwork(); // Requires fabricUtils.js
const contract = network.getContract('voting');
await contract.submitTransaction('castVote', matricNumber, candidate);
```

## Wallet Structure
```
backend/wallet/
├── admin.id      # Created by enrollAdmin.js
├── admin2.id     # Created by enrollAdmin2.js
└── appUser.id    # Created by registerUser.js
```

## Error Resolution

### "Admin identity not found in wallet"
**Solution**: Run `npm run enroll-admin`

### "Failed to connect to Fabric network"
**Solution**: 
1. Ensure Fabric network is running
2. Ensure identities are properly enrolled
3. Check connection.json path

### "DiscoveryService has failed to return results"
**Solution**:
1. Ensure peers are running: `docker ps`
2. Ensure channel is joined: `./network.sh deployCC`
3. Check network configuration

## Important Notes

1. **NEVER DELETE** these identity files - they're essential for blockchain operations
2. **Web Admin System** (MongoDB) is separate from **Fabric Admin System** (blockchain)
3. **Web Admin** = User interface management
4. **Fabric Admin** = Blockchain network management

## Testing Blockchain Connection

```bash
# Test admin enrollment
npm run enroll-admin

# Test user registration
npm run register-user

# Test blockchain connection
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"matricNumber":"TEST001","surname":"Test"}'
```

## Troubleshooting

### Fabric Network Issues:
1. Check if containers are running: `docker ps`
2. Restart network: `./network.sh down && ./network.sh up`
3. Redeploy chaincode: `./network.sh deployCC`

### Identity Issues:
1. Clear wallet: `rm -rf wallet/*`
2. Re-enroll identities: `npm run enroll-admin`
3. Re-register users: `npm run register-user`

### Connection Issues:
1. Verify connection.json path
2. Check Fabric network status
3. Ensure proper identity enrollment 
const fs = require("fs");
const keythereum = require("keythereum");

// Path to your keystore JSON file
const keyObject = JSON.parse(fs.readFileSync("/root/snap/geth/477/.ethereum/keystore/UTC--...json"));

// Your password you set during account creation
const password = "";

// Recover private key
const privateKey = keythereum.recover(password, keyObject);

console.log("Private Key:", privateKey.toString('hex'));
console.log("Account Address:", keyObject.address);
console.log("Copy the private key above to your .env file as PRIVATE_KEY=0x" + privateKey.toString('hex'));

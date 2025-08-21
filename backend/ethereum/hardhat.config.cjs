require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    remote: {
      url: process.env.REMOTE_NODE_URL || "http://206.81.24.9:8545",
      chainId: parseInt(process.env.REMOTE_CHAIN_ID || "0"),
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here" 
        ? [process.env.PRIVATE_KEY] 
        : []
    },
    "remote-readonly": {
      url: process.env.REMOTE_NODE_URL || "http://206.81.24.9:8545",
      chainId: parseInt(process.env.REMOTE_CHAIN_ID || "0")
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

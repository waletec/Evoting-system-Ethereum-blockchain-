const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    try {
        const [deployer] = await hre.ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", (await deployer.getBalance()).toString());

        // Deploy the contract with initial candidates
        const candidates = ["Alice", "Bob", "Charlie"];
        const VoteCC = await hre.ethers.getContractFactory("VoteCC");
        const vote = await VoteCC.deploy(candidates);

        console.log("Waiting for deployment...");
        await vote.waitForDeployment();
        const contractAddress = await vote.getAddress();
        console.log("VoteCC deployed to:", contractAddress);

        // Save deployment info
        const deploymentInfo = {
            address: contractAddress,
            network: hre.network.name,
            deployer: deployer.address,
            initialCandidates: candidates,
            timestamp: new Date().toISOString()
        };

        // Save deployment info
        const deploymentDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(deploymentDir, `${hre.network.name}.json`),
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Save ABI and address for frontend use
        const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(artifactsDir, "VoteCC.json"),
            JSON.stringify({
                address: contractAddress,
                abi: VoteCC.interface.format('json'),
                network: hre.network.name
            }, null, 2)
        );

        // Update .env file
        const envPath = path.join(__dirname, "..", "..", ".env");
        let envContent = "";
        
        try {
            envContent = fs.readFileSync(envPath, "utf8");
        } catch (error) {
            console.log("Creating new .env file");
        }

        const envUpdate = `CONTRACT_ADDRESS=${contractAddress}\n`;
        if (envContent.includes("CONTRACT_ADDRESS=")) {
            envContent = envContent.replace(/CONTRACT_ADDRESS=.*\n/, envUpdate);
        } else {
            envContent += envUpdate;
        }

        fs.writeFileSync(envPath, envContent);

        console.log("Deployment successful! Files updated:");
        console.log("1. Contract artifacts saved to:", path.join(artifactsDir, "VoteCC.json"));
        console.log("2. Deployment info saved to:", path.join(deploymentDir, `${hre.network.name}.json`));
        console.log("3. Environment file updated:", envPath);
    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

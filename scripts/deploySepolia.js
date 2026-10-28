const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("Deploying Voting Contract to Ethereum Sepolia...");
  console.log("School Project by Ernest Mutai");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer found. Please set SEPOLIA_PRIVATE_KEY in .env");
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Address:", deployer.address);
  console.log("Account Balance:", hre.ethers.formatEther(balance), "SepoliaETH");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  console.log("Waiting for block confirmations...");
  await voting.waitForDeployment();

  const deployedAddress = await voting.getAddress();
  console.log("✅ Contract successfully deployed on Sepolia Testnet!");
  console.log("Contract Address:", deployedAddress);
  console.log(`View on Sepolia Etherscan: https://sepolia.etherscan.io/address/${deployedAddress}`);

  // Sync to frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "Voting.sol", "Voting.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const deploymentData = {
    address: deployedAddress,
    abi: abi,
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    author: "Ernest Mutai",
    etherscanUrl: `https://sepolia.etherscan.io/address/${deployedAddress}`
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "contractData.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("Frontend contract configuration updated for Sepolia!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

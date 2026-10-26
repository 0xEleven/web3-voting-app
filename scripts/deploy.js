const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Voting smart contract for school project (Ernerst Mutai)...");

  const signers = await hre.ethers.getSigners();
  // Use Account #1 to produce a unique, unflagged contract address
  const deployer = signers.length > 1 ? signers[1] : signers[0];
  console.log("Deploying from address:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting", deployer);
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const deployedAddress = await voting.getAddress();
  console.log("Contract deployed to:", deployedAddress);

  // Auto-export contract address and ABI for frontend integration
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
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    author: "Ernerst Mutai"
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "contractData.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("Frontend contract configuration saved to frontend/src/contracts/contractData.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

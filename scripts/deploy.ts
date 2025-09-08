import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TrustBet contracts to Intuition testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "tTRUST");

  // Deploy WTRUST
  console.log("\nDeploying WTRUST...");
  const WTRUST = await ethers.getContractFactory("WTRUST");
  const wtrust = await WTRUST.deploy();
  await wtrust.waitForDeployment();
  const wtrustAddress = await wtrust.getAddress();
  console.log("WTRUST deployed to:", wtrustAddress);

  // Deploy PredictionMarket
  console.log("\nDeploying PredictionMarket...");
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(wtrustAddress, deployer.address);
  await predictionMarket.waitForDeployment();
  const pmAddress = await predictionMarket.getAddress();
  console.log("PredictionMarket deployed to:", pmAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("WTRUST:", wtrustAddress);
  console.log("PredictionMarket:", pmAddress);
  console.log("Deployer:", deployer.address);
  console.log("\nAdd these to your .env file:");
  console.log(`WTRUST_ADDRESS=${wtrustAddress}`);
  console.log(`PREDICTION_MARKET_ADDRESS=${pmAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
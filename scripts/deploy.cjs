const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer configured. Set PRIVATE_KEY in .env.");

  console.log(`Deploying ProofStream with ${deployer.address}...`);
  const Factory = await hre.ethers.getContractFactory("ProofStream");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`ProofStream deployed to: ${address}`);
  console.log(`Explorer: https://testnet.monadscan.com/address/${address}`);
  console.log(`Set NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

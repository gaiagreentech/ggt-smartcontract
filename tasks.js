
require("@nomiclabs/hardhat-web3");

task("deploy", "Deploy the contract", async ( _, hre ) => {
  // get current logged in account from metamask
  const accounts = await hre.web3.eth.getAccounts()

	const WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT", accounts[0]);

	const deploy = await WEEECycleNFT.deploy(1000);

	await deploy.deployed();

	console.log("WEEECycleNFT deployed to:", deploy.address);
})

task("mint", "Give the address argument one NFT")
  .addParam("address", "Set the address to mint the token")
  .setAction(async ( args, hre ) => {
    const accounts = await hre.web3.eth.getAccounts()

    const WEEECycleNFT = await hre.ethers.getContractAt("WEEECycleNFT", accounts[0])

    const tx = await WEEECycleNFT.connect(accounts[0]).safeMint(args.address)

    await tx.wait()

    console.log(`Minted NFT to ${args.address} on transaction ${tx.id}` )
})
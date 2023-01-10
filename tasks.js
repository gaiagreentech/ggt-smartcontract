
require("@nomiclabs/hardhat-web3");

task("deploy", "Deploy the contract")
   .addParam("interval", "Set the interval for all the tokens to be disposed", 30 * 24 * 60 * 60, types.int)
   .setAction( async ( { interval }, hre ) => {
      const accounts = await hre.web3.eth.getAccounts()

      const WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT", accounts[0]);

      const deploy = await WEEECycleNFT.deploy(interval);

      await deploy.deployed();

      console.log("WEEECycleNFT deployed to:", deploy.address);
  })

task("mint", "Give the address argument one NFT")
  .addParam("contract", "Set the address of the contract")
  .addParam("address", "Set the address to mint the token")
  .addParam("uri", "Set the NFT data. Preferably a IPFS url")
  .setAction(async ( args, hre ) => {
    const accounts = await hre.web3.eth.getAccounts()
    const signer = await hre.ethers.getSigner(accounts[0])

    const WEEECycleNFT = await hre.ethers.getContractAt("WEEECycleNFT", args.contract)

    const tx = await WEEECycleNFT.connect(signer).safeMint(args.address, args.uri)

    const txEnd = await tx.wait()

    console.log(`Minted NFT to ${args.address} on transaction ${txEnd.transactionHash}` )
})
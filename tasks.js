require("@nomiclabs/hardhat-web3");
const fs = require("node:fs");
const { exec } = require("child_process");

const ipfsProjectId = process.env.IPFS_PROJECT_ID;
const ipfsProjectSecret = process.env.IPFS_PROJECT_SECRET;
const ipfsEndpoint = process.env.IPFS_API_ENDPOINT;

const cmd = (file) => `./lib/ipfs-upload-client --id ${ipfsProjectId} --url ${ipfsEndpoint} --secret ${ipfsProjectSecret} "${file}"`;

async function uploadFileToIPFS(filePath) {
  return new Promise((resolve, reject) => {
    exec(cmd(filePath), (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.error(`Error: ${stderr}`);
        reject(stderr);
      } else {
        const cid = stdout.trim();
        console.log(`File uploaded to IPFS with hash: ${cid}`);
        resolve(`ipfs://${cid}`);
      }
    });
  });
}


task("deploy", "Deploy the contract")
   .addParam("interval", "Set the interval for all the tokens to be disposed", 30 * 24 * 60 * 60, types.int)
   .setAction( async ( { interval }, hre ) => {
      const accounts = await hre.web3.eth.getAccounts()

      const WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT", accounts[0]);

      const deploy = await WEEECycleNFT.deploy(interval);

      await deploy.deployed();

      console.log("WEEECycleNFT deployed to:", deploy.address);
  })

task("deploy-marketplace", "Deploy marketplace")
   .addParam("fee", "Set the fee for the marketplace, in WEI", 2500000000 , types.int)
   .setAction( async ( args, hre ) => {
      const accounts = await hre.web3.eth.getAccounts()

      const WEEEMarket = await hre.ethers.getContractFactory("WEEEMarket", accounts[0]);

      const deploy = await WEEEMarket.deploy(args.fee);

      await deploy.deployed();

      console.log("WEEEMarket deployed to:", deploy.address);
  })



task("add-minter", "Add a new minter to the contract")
  .addParam("contract", "Set the address of the contract")
  .addParam("address", "Set the address of the new minter")
  .addParam("document", "Set the document URI for the new minter")
  .setAction(async (args, hre) => {
    const accounts = await hre.web3.eth.getAccounts();
    const signer = await hre.ethers.getSigner(accounts[0]);

    const WEEECycleNFT = await hre.ethers.getContractAt("WEEECycleNFT", args.contract);

    const tx = await WEEECycleNFT.connect(signer).addMinter(args.address, args.document);

    const txEnd = await tx.wait();

    console.log(`Added minter ${args.address} with document URI ${args.document} on transaction ${txEnd.transactionHash}`);
  });

task("generate-metadata", "Generate metadata file and upload files to IPFS")
  .addParam("path", "Set the path of the file to upload")
  .addParam("weight", "Set the weight of the NFT, in Kg." )
  .setAction(async (args, hre) => {

    // Read files from the 'files' directory and build an array of IPFS traits
    const traits = [];
    const filesDir = args.path;
    const files = fs.readdirSync(filesDir);
    for (const file of files) {
      const traitType = file.replace(/\.[^/.]+$/, "");
      const traitValue = await uploadFileToIPFS(`${filesDir}/${file}`);
      traits.push({ trait_type: traitType, value: traitValue.replace("///ipfs", "/") });
    }

    //TODO: remove hardcoded weight
    traits.push({ trait_type: "weight", value: args.weight })

    // Build metadata object
    const metadata = {
      name: "WEEECycle",
      description: "A prototype for WEEE NFTs",
      attributes: traits,
    };

    // Write metadata to a file
    const metadataPath = "./metadata/metadata.json";
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));

    console.log(`Metadata file saved to ${metadataPath}`);
  });

task("upload-metadata", "Upload file to IPFS using Infura")
  .addParam("metadata", "Set the path of the file to upload")
  .setAction(async (args, hre) => {
    try {
      const { stdout, stderr } = await uploadFileToIPFS(args.metadata);
      if (stderr) console.error(`Error: ${JSON.stringify(stderr)}`);
      if (stdout) console.log(`File uploaded to IPFS with hash: ${JSON.stringify(stdout)}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  });


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
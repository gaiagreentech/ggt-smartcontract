require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

require('./tasks.js');


const MATIC_URL = process.env.MATIC_URL;

const MUMBAI_URL = process.env.MUMBAI_URL;

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "mumbai",
	networks: {
		hardhat: {},
		mumbai: {
			url: MUMBAI_URL,
			accounts: [PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000,
		},
	},
	solidity: {
		version: "0.8.17",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	etherscan: {
      apiKey: POLYGONSCAN_API_KEY,
			polygon: POLYGONSCAN_API_KEY,
			polygonMumbai: POLYGONSCAN_API_KEY,
		},
	}

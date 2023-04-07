const hre = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { expect } = require("chai");

describe("WEEECycleNFT", function () {
  let mine;
  let performCycle;
  let getBalance;
  let safeMint;
  let createAddress;
  let addFunds;
  let transfer;

  beforeEach(async function () {
    this.WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT");
    this.deploy = await this.WEEECycleNFT.deploy(30); //3 seconds interval
    this.provider = hre.ethers.provider;

    getBlockLog = async () => {
      const block = await this.provider.getBlock("latest");
      const logLine = new Error().stack.split("\n")[6]?.trim()
      const logLine1 = new Error().stack.split("\n")[7]?.trim()
      console.log(`${block.number}`, `${block.timestamp, logLine?.split("(")[0]?.trim()}:${logLine?.split(":")[1]?.trim()} | ${logLine1?.split(":")[1]?.trim()}`);
    };

    mine = async (blocks, { interval = 30 } = { interval: 30}) => {
      await getBlockLog();

      for (let i = 0; i < blocks; i++) {
        await this.provider.send("evm_increaseTime", [interval]);
        await this.provider.send("evm_mine", []);
      }

      await getBlockLog();
    };

    safeMint = async (address) => {
      await getBlockLog();
      const [owner] = await hre.ethers.getSigners();
      const tx = await this.deploy
        .connect(owner)
        .safeMint(address, { file: "fileurl" });
      await tx.wait();

      await getBlockLog();
    };

    performCycle = async () => {
      await getBlockLog();
      const res = await this.deploy.checkUpkeep(00);
      const { upkeepNeeded, performData } = res;
      console.log("> upkeepNeeded", upkeepNeeded, "performData", performData);
      if (upkeepNeeded) {
        const tx1b = await this.deploy.performUpkeep(performData);
        await tx1b.wait();
      }
      await getBlockLog();
    };

    addFunds = async (address) => {
      await getBlockLog();
      const [owner] = await hre.ethers.getSigners();
      await owner.sendTransaction({
        to: address,
        value: hre.ethers.utils.parseEther("1.0"),
      });
      await getBlockLog();
    };

    createAddress = () =>
      hre.ethers.Wallet.createRandom().connect(this.provider);

    getBalance = async (address) =>
      (await this.deploy.balanceOf(address))["_hex"];

    transfer = async (from, to) => {
      await getBlockLog();
      const tx2 = await this.deploy
        .connect(from)
        .transferFrom(from.address, to.address, 1); //token id
      await tx2.wait();
      await getBlockLog();
    };

    await this.deploy.deployed();
  });

  describe("Mint", function () {
    it("Should mint a new NFT", async function () {
      const add2 = createAddress();
      expect(await getBalance(add2.address)).to.equal("0x00");
      await safeMint(add2.address); // Safe mint automatically mines a block
      expect(await getBalance(add2.address)).to.equal("0x01");
    });
  });

  describe("Deployment", function () {
    it("Should no execute upkeep if it is not needed", async function () {
      expect((await this.deploy.checkUpkeep(00)).upkeepNeeded).to.equal(false);
      await mine(1);
      expect((await this.deploy.checkUpkeep(00)).upkeepNeeded).to.equal(false);
      await mine(234);
      expect((await this.deploy.checkUpkeep(00)).upkeepNeeded).to.equal(false);
    });
  });

  describe("Auto-Burn", function () {
    it("Should burn tokens when interval time is due", async function () {
      const add2 = createAddress();
      expect(await getBalance(add2.address)).to.equal("0x00");
      await safeMint(add2.address); // Safe mint automatically mines a block
      await performCycle();
      await performCycle();
      await performCycle();
      expect(await getBalance(add2.address)).to.equal("0x01");
      await mine(1);
      await performCycle();
      expect(await getBalance(add2.address)).to.equal("0x00");
    });
  });

  describe("Transfer", function () {
    it("Should transfer from one person to the other", async function () {
      const add2 = createAddress();
      const add3 = createAddress();

      //add funds to add2 so it have gas to transfer
      await addFunds(add2.address);


      expect(await getBalance(add2.address)).to.equal("0x00");
      await safeMint(add2.address);
      expect(await getBalance(add2.address)).to.equal("0x01");


      await transfer(add2, add3);
      expect(await getBalance(add2.address)).to.equal("0x00");
      expect(await getBalance(add3.address)).to.equal("0x01");

      await mine(1);
      await performCycle();
      expect(await getBalance(add2.address)).to.equal("0x00");
      expect(await getBalance(add3.address)).to.equal("0x00");
    });
  });

  describe("Auto-Burn", function () {
    it("Should only burn tokens when their time has come, no matter the block id", async function () {
      const add2 = createAddress();
      expect(await getBalance(add2.address)).to.equal("0x00");

      // Safe mint automatically mines a block
      await safeMint(add2.address);
      await mine(1, { interval: 1});
      await safeMint(add2.address);
      await mine(1, { interval: 1 });
      await safeMint(add2.address);
      await mine(1, { interval: 1 });
      await safeMint(add2.address);
      await mine(1, { interval: 1 });

      expect(await getBalance(add2.address)).to.equal("0x04");
      await mine(1, { interval: 1 });
      await performCycle(); // should be false
      await mine(1, { interval: 1 });
      await performCycle(); // should be false
      await mine(1, { interval: 1 });
      await performCycle(); // should be false
      await mine(1, { interval: 1 });
      await performCycle(); // should be false
      expect(await getBalance(add2.address)).to.equal("0x04");
      await mine(1, { interval: 26 });
      await performCycle(); // should be true, and include all the tokens
      expect(await getBalance(add2.address)).to.equal("0x00");

      await safeMint(add2.address);
      await safeMint(add2.address);
      await safeMint(add2.address);
      await safeMint(add2.address);

      expect(await getBalance(add2.address)).to.equal("0x04");
      await mine(1);
      await performCycle(); // should be true
      expect(await getBalance(add2.address)).to.equal("0x00");
      await mine(1);
    });
  });
});

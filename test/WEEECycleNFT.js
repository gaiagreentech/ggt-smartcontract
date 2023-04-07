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
    this.deploy = await this.WEEECycleNFT.deploy(10); //3 seconds interval
    this.provider = hre.ethers.provider;

    getBlockLog = async () => {
      const block = await this.provider.getBlock("latest");
      const logLine = new Error().stack.split("\n")[6]?.trim()
      const logLine1 = new Error().stack.split("\n")[7]?.trim()
      //console.log(`${block.number}`, `${block.timestamp, logLine?.split("(")[0]?.trim()}:${logLine?.split(":")[1]?.trim()} | ${logLine1?.split(":")[1]?.trim()}`);
    };

    mine = async (blocks, { interval = 10 } = { interval: 10}) => {
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
      // console.log("> upkeepNeeded", upkeepNeeded, "performData", performData);
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
      await safeMint(add2.address);
      expect(await getBalance(add2.address)).to.equal("0x01");
    });
  });

  describe("Deployment", function () {
    it("Should no execute upkeep if it is not needed", async function () {
      result = await this.deploy.checkUpkeep(00);
      expect(result.upkeepNeeded).to.equal(false);
      await mine(1);
      result = await this.deploy.checkUpkeep(00);
      expect(result.upkeepNeeded).to.equal(false);
      await mine(1);
      result = await this.deploy.checkUpkeep(00);
      expect(result.upkeepNeeded).to.equal(false);
    });
  });

  describe("Auto-Burn", function () {
    it("Should burn tokens when interval time is due", async function () {
      const add2 = createAddress();
      expect(await getBalance(add2.address)).to.equal("0x00");
      await safeMint(add2.address);
      await performCycle();
      expect(await getBalance(add2.address)).to.equal("0x01");
      await mine(2);
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
    });
  });

  describe("Auto-Burn", function () {
    it("Should only burn tokens when their time has come", async function () {
      const add2 = createAddress();
      expect(await getBalance(add2.address)).to.equal("0x00");

      await safeMint(add2.address);
      await safeMint(add2.address);
      await safeMint(add2.address);
      await safeMint(add2.address);

      expect(await getBalance(add2.address)).to.equal("0x04");
      await mine(1, { interval: 1 });
      await performCycle(); // should be false
      await performCycle(); // should be false
      await performCycle(); // should be false
      await performCycle(); // should be false
      expect(await getBalance(add2.address)).to.equal("0x04");
      await mine(1);
      await performCycle(); // should be true
      expect(await getBalance(add2.address)).to.equal("0x03");
      await mine(1);
      await performCycle(); // should be true
      expect(await getBalance(add2.address)).to.equal("0x02");
      // await performCycle();
      // expect(await getBalance(add2.address)).to.equal("0x01");
      // await mine(1);
      // await performCycle();
      // expect(await getBalance(add2.address)).to.equal("0x00");
    });
  });
  // describe("Multiple Wallets Auto-Burn", function () {
  //   it("Should burn tokens individually when interval time is due", async function () {
  //     const getBalance = async (address) =>
  //       (await this.deploy.balanceOf(address))["_hex"];

  //     const add2 = ethers.Wallet.createRandom().connect(this.provider);
  //     const add3 = ethers.Wallet.createRandom().connect(this.provider);
  //     const add4 = ethers.Wallet.createRandom().connect(this.provider);

  //     await addFunds(add2.address);

  //     expect(await getBalance(add2.address)).to.equal("0x00");
  //     expect(await getBalance(add3.address)).to.equal("0x00");
  //     expect(await getBalance(add4.address)).to.equal("0x00");

  //     // Mint 5 tokens with different wallets at different times
  //     // Mint 5 tokens with different wallets at different times
  //     const token1 = await this.deploy
  //       .connect(add2)
  //       .safeMint(add2.address, { file: "fileurl1" });
  //     await token1.wait();
  //     const block1 = await this.provider.getBlock("latest");
  //     expect(await getBalance(add2.address)).to.equal("0x01");
  //     expect(await getBalance(add3.address)).to.equal("0x00");
  //     expect(await getBalance(add4.address)).to.equal("0x00");

  //     const token2 = await this.deploy
  //       .connect(add3)
  //       .safeMint(add3.address, { file: "fileurl2" });
  //     await token2.wait();
  //     const block2 = await this.provider.getBlock("latest");
  //     expect(await getBalance(add2.address)).to.equal("0x01");
  //     expect(await getBalance(add3.address)).to.equal("0x01");
  //     expect(await getBalance(add4.address)).to.equal("0x00");

  //     const token3 = await this.deploy
  //       .connect(add4)
  //       .safeMint(add4.address, { file: "fileurl3" });
  //     await token3.wait();
  //     const block3 = await this.provider.getBlock("latest");
  //     expect(await getBalance(add2.address)).to.equal("0x01");
  //     expect(await getBalance(add3.address)).to.equal("0x01");
  //     expect(await getBalance(add4.address)).to.equal("0x01");

  //     const token4 = await this.deploy
  //       .connect(add2)
  //       .safeMint(add2.address, { file: "fileurl4" });
  //     await token4.wait();
  //     const block4 = await this.provider.getBlock("latest");
  //     expect(await getBalance(add2.address)).to.equal("0x02");
  //     expect(await getBalance(add3.address)).to.equal("0x01");
  //     expect(await getBalance(add4.address)).to.equal("0x01");

  //     const token5 = await this.deploy
  //       .connect(add4)
  //       .safeMint(add4.address, { file: "fileurl5" });
  //     await token5.wait();
  //     const block5 = await this.provider.getBlock("latest");
  //     expect(await getBalance(add2.address)).to.equal("0x02");
  //     expect(await getBalance(add3.address)).to.equal("0x01");
  //     expect(await getBalance(add4.address)).to.equal("0x02");

  //     // Wait for the first token to expire and burn it
  //     await mine(block2.timestamp - block1.timestamp + 1, { interval: 3001 });
  //     await this.deploy.checkUpkeep(00);
  //     const token1Burn = await this.deploy.connect(add2).performUpkeep(1);
  //     await token1Burn.wait();

  //     // Wait for the second token to expire and burn it
  //     await mine(block3.timestamp - block2.timestamp + 1, { interval: 3001 });
  //     await this.deploy.checkUpkeep(00);
  //     const token2Burn = await this.deploy.connect(add3).performUpkeep(2);
  //     await token2Burn.wait();

  //     // Wait for the third token to expire and burn it
  //     await mine(block4.timestamp - block3.timestamp + 1, { interval: 3001 });
  //     await this.deploy.checkUpkeep(00);
  //     const token3Burn = await this.deploy.connect(add4).performUpkeep(3);
  //     await token3Burn.wait();

  //     // Wait for the fourth token to expire and burn it
  //     await mine(block5.timestamp - block4.timestamp + 1, { interval: 3001 });
  //     await this.deploy.checkUpkeep(00);
  //     const token4Burn = await this.deploy.connect(add2).performUpkeep(4);
  //     await token4Burn.wait();

  //     // Wait for the fifth token to expire and burn it
  //     await mine(3001);
  //     await this.deploy.checkUpkeep(00);
  //     const token5Burn = await this.deploy.connect(add4).performUpkeep(5);
  //     await token5Burn.wait();

  //     expect(await getBalance(add2.address)).to.equal("0x01");
  //     expect(await getBalance(add3.address)).to.equal("0x01");
  //     expect(await getBalance(add4.address)).to.equal("0x01");
  //   });
  // });
});

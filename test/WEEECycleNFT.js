
const hre = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { expect } = require("chai");

describe("WEEECycleNFT", function () {
  
  before(async function () {
    this.WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT");
    this.deploy = await this.WEEECycleNFT.deploy(3000) //3 seconds interval

    await this.deploy.deployed()
  });

  describe("Deployment", function () {
    it("Should set the correct checkUpkeep", async function () {
      let result = await this.deploy.checkUpkeep(00)
      expect(result.upkeepNeeded).to.equal(false)

      await mine(2, { interval: 3001 })
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds

      result = await this.deploy.checkUpkeep(00)
      expect(result.upkeepNeeded).to.equal(true) //should update nowz
    });
  });

  describe("Auto-Burn", function(){
     it("Should burn minted contract", async function () {
      const [owner] = await hre.ethers.getSigners()

      let balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x00')

      const tx = await this.deploy.connect(owner).safeMint(owner.address, { "file": "fileurl" })

      await tx.wait()

      balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x01')

      await mine(2, { interval: 3001 })
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds

      await this.deploy.performUpkeep(00)

      await mine(1)
      
      balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x00')
    });
  })

  describe("Transfer", function(){
     it("Should transfer from one person to the other", async function () {

      const [owner, account1] = await hre.ethers.getSigners()

      let balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x00')
      const tx = await this.deploy
        .connect(owner)
        .safeMint(owner.address, { "file": "fileurl" })

      await tx.wait()

      balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x01')

      await this.deploy.connect(owner).transferFrom(owner.address, account1.address, 2) //token id

      balance = await this.deploy.balanceOf(owner.address)
      expect(balance._hex).to.equal('0x00')

      balance = await this.deploy.balanceOf(account1.address)
      expect(balance._hex).to.equal('0x01')

    })
  })
})

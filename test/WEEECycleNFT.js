
const hre = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


const { expect } = require("chai");

describe("WEEECycleNFT", function () {
  
  beforeEach(async function () {
    this.WEEECycleNFT = await hre.ethers.getContractFactory("WEEECycleNFT");
    this.deploy = await this.WEEECycleNFT.deploy(3000) //3 seconds interval
    this.provider = hre.ethers.provider

    await this.deploy.deployed()
  });

  describe("Mint", function () {
    it("Should mint a new NFT", async function () {
      const [owner] = await hre.ethers.getSigners()
      const add2 = hre.ethers.Wallet.createRandom().connect(this.provider)

      let balance = await this.deploy.balanceOf(add2.address)
      expect(balance._hex).to.equal('0x00')

      const tx = await this.deploy.connect(owner).safeMint(add2.address, { "file": "fileurl" })

      await tx.wait()

      balance = await this.deploy.balanceOf(add2.address)
      expect(balance._hex).to.equal('0x01')
    });
  });

  describe("Deployment", function () {
    it("Should no execute upkeep if it is not needed", async function () {
      let tx
      let result 
      result = await this.deploy.checkUpkeep(00)
      expect(result.upkeepNeeded).to.equal(false)

      await mine(1, { interval: 3001 })

      result = await this.deploy.checkUpkeep(00)
      expect(result.upkeepNeeded).to.equal(false) 

      await mine(1, { interval: 3001 })

      result = await this.deploy.checkUpkeep(00)
      expect(result.upkeepNeeded).to.equal(false) 
    });
  });

  describe("Auto-Burn", function(){
     it("Should burn tokens when interval time is due", async function () {
      const [owner] = await hre.ethers.getSigners()
      const add2 = hre.ethers.Wallet.createRandom().connect(this.provider)
      let tx


      const getBalance = async () => (await this.deploy.balanceOf(add2.address))["_hex"]

      expect(await getBalance()).to.equal('0x00')

      tx = await this.deploy.connect(owner).safeMint(add2.address, { "file": "fileurl" })

      await tx.wait()
      expect(await getBalance()).to.equal('0x01')

      await mine(2, { interval: 3001 })
      const res = await this.deploy.checkUpkeep(00)

      if(!res.upkeepNeeded) throw new Error("Upkeep is not needed")
      
      tx = await this.deploy.performUpkeep(res.performData)
      await tx.wait()
      await mine(10, { interval: 3001 })
      

      expect(await getBalance(add2)).to.equal('0x00')
    });
  })

  describe("Transfer", function(){
     it("Should transfer from one person to the other", async function () {

      const [owner] = await hre.ethers.getSigners()
      const add2 = hre.ethers.Wallet.createRandom().connect(this.provider)
      const add3 = hre.ethers.Wallet.createRandom().connect(this.provider)

      //add funds to add2 so it have gas to transfer
      await owner.sendTransaction({
        to: add2.address,
        value: hre.ethers.utils.parseEther("1.0"),
      });

      const getBalance = async (address) => (await this.deploy.balanceOf(address))["_hex"]

      expect(await getBalance(add2.address)).to.equal('0x00')
      const tx = await this.deploy
        .connect(owner)
        .safeMint(add2.address, { "file": "fileurl" })

      await tx.wait()

      expect(await getBalance(add2.address)).to.equal('0x01')

      const tx2 = await this.deploy.connect(add2).transferFrom(add2.address, add3.address, 1) //token id
      await tx2.wait()

      expect(await getBalance(add2.address)).to.equal('0x00')
      expect(await getBalance(add3.address)).to.equal('0x01')

    })
  })
})

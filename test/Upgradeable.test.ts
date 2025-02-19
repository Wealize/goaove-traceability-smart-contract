// AssetTraceability.test.ts
// COPYRIGHT: FUNDACIÓN TECNALIA RESEARCH & INNOVATION, 2024.
// By virtue of the outsourcing agreement of the project ZL-2021/00717, with acronym N0WASTE, this file becomes property of IZERTIS S.A. (VAT A-33845009).
// Licensed to TECNALIA under the following conditions: non-exclusive, irrevocable, transferable, sublicensable, and royalty free.
// This license is effective without end date.

import { expect } from "chai"
import { ethers } from "hardhat"
import {
  AssetTraceability,
  AssetTraceability__factory,
  AssetTraceabilityV2,
  AssetTraceabilityV2__factory
} from "typechain-types"



// Data for test
const baseUri = "ipfs://baseurlipfs.com/"

//const CONTRACT_ADDRESS = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B"  // Ganache local
const CONTRACT_ADDRESS_ = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1" // Alasgtria Besu (upgrade)
//const CONTRACT_ADDRESS = "0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb" // Alasgtria Besu (regular)
//const CONTRACT_ADDRESS = "0xB7740ea40790122206a96AD12D45dF743a32FbFb" // Alasgtria (regular)


//const CONTRACT_ADDRESS = "0x9810a09EE584b9F013DA9979b6ffD3CD6805935D" // Alasgtria T (deploy upgrade old) address logic
const CONTRACT_ADDRESS = "0x0B4dcbe4591Aed0EF400d0623f7c19d16C077DBA" // Alasgtria T (deploy upgrade old) address proxy

describe("Test Upgradeable Contract", () => {

  describe("Get Base URI", () => {

    it("Should get value use contract AssetTraceability", async () => {
      const [admin] = await ethers.getSigners()

      const factory = (await ethers.getContractFactory(
        "AssetTraceability",
        admin
      )) as AssetTraceability__factory
      const contract = factory.attach(CONTRACT_ADDRESS) as AssetTraceability

      const asset = await contract.getAsset(0)
      console.log("asset: ", asset)
      const result = await contract.getBaseURI()
      expect(result).to.be.equal("v2")
    })
    it("Should get value use contract AssetTraceabilityV2", async () => {
      const [admin] = await ethers.getSigners()

      const factory = (await ethers.getContractFactory(
        "AssetTraceabilityV2",
        admin
      )) as AssetTraceabilityV2__factory
      const contract = factory.attach(CONTRACT_ADDRESS) as AssetTraceabilityV2

      const result = await contract.getBaseURI()
      expect(result).to.be.equal("v2")
    })
  })

})

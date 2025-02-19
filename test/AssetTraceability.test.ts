// AssetTraceability.test.ts
// COPYRIGHT: FUNDACIÓN TECNALIA RESEARCH & INNOVATION, 2024.
// By virtue of the outsourcing agreement of the project ZL-2021/00717, with acronym N0WASTE, this file becomes property of IZERTIS S.A. (VAT A-33845009).
// Licensed to TECNALIA under the following conditions: non-exclusive, irrevocable, transferable, sublicensable, and royalty free.
// This license is effective without end date.

import { expect } from "chai"
import { CONTRACTS } from "configuration"
import { ZeroAddress, BigNumberish, AbstractSigner } from "ethers"
import { ethers, upgrades } from "hardhat"
import {
  AssetTraceability__factory,
  AssetTraceability,
  AssetTraceabilityV2__factory,
  AssetTraceabilityV2
} from "typechain-types"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import {
  OperationType,
  expectEqualBNArray,
  extractCreatedTokenIds,
  CreateTokenForUser,
  AllowToOperate,
  buildTokenCreator
} from "./utils"

// Specific Constants
const REVERT_MESSAGES = {
  initializable: {
    alreadyInit: "Initializable: contract is already initialized"
  },
  accessControl: {
    notValidAddress: "/AccessControl: account .* is missing role .*//*"
  },
  ownable: {
    callerNotOwner: "Ownable: caller is not the owner"
  },
  erc721: {
    callerNotOwner: "ERC721: caller is not token owner or approved",
    mintZeroAddress: "ERC721: mint to the zero address",
    invalidToken: "ERC721: invalid token ID"
  }
}

// Data for test
const baseUri = "ipfs://baseurlipfs.com/"

describe("AssetTraceability", () => {
  async function initContract(): Promise<{
    contract: AssetTraceability
    admin: AbstractSigner
    users: AbstractSigner[]
    createTokenForUser: CreateTokenForUser
    allowToOperate: AllowToOperate
  }> {
    const [admin, ...users] = await ethers.getSigners()
    const factory = (await ethers.getContractFactory(
      CONTRACTS.AssetTraceability.name,
      admin
    )) as AssetTraceability__factory

    const proxy = await upgrades.deployProxy(factory)
    await proxy.waitForDeployment()

    const contract = factory.attach(
      await proxy.getAddress()
    ) as AssetTraceability

    await contract.setBaseURI(baseUri)

    return {
      contract,
      admin,
      users,
      createTokenForUser: buildTokenCreator(
        contract,
        admin,
        22, // default type
        33 // default group id
      ),
      allowToOperate: async (owner, operatorAddress, tokens) => {
        // Allow admin to operate with tokens to be merged
        for (let tokenId of tokens) {
          await contract.connect(owner).approve(operatorAddress, tokenId)
        }
      }
    }
  }

  async function registerOneToken(): Promise<{
    tokenOwner: AbstractSigner
    otherUsers: AbstractSigner[]
    testToken: bigint
    contract: AssetTraceability
    allowToOperate: AllowToOperate
  }> {
    const { contract, users, allowToOperate, createTokenForUser } =
      await initContract()

    const tokenOwner = users[2]
    const otherUsers = users.filter((_, i) => i !== 2)
    const testToken = await createTokenForUser(tokenOwner)

    return {
      allowToOperate,
      tokenOwner,
      otherUsers,
      testToken,
      contract: contract.connect(tokenOwner)
    }
  }

  describe("Deployment", () => {
    it("should deploy contract using proxy", async () => {
      const [admin] = await ethers.getSigners()

      const factory = (await ethers.getContractFactory(
        CONTRACTS.AssetTraceability.name,
        admin
      )) as AssetTraceability__factory

      const proxy = await upgrades.deployProxy(factory)
      await proxy.waitForDeployment()

      const contract = factory.attach(
        await proxy.getAddress()
      ) as AssetTraceability

      const deployedAddr = await contract.getAddress()
      expect(deployedAddr).not.to.equal(ZeroAddress)
    })

    it("should deploy a new upgraded version of the contract", async () => {
      const [admin] = await ethers.getSigners()
      const factory = (await ethers.getContractFactory(
        CONTRACTS.AssetTraceability.name,
        admin
      )) as AssetTraceability__factory

      const proxy = await upgrades.deployProxy(factory)
      await proxy.waitForDeployment()

      const contractImplAddrV1 =
        await upgrades.erc1967.getImplementationAddress(
          await proxy.getAddress()
        )

      const contractV1 = factory.attach(
        await proxy.getAddress()
      ) as AssetTraceability
      await contractV1.setBaseURI("baseUri1")

      // NOTE: we actually deploy the same version not to create a fake v2 contract
      const factoryV2 = (await ethers.getContractFactory(
        "AssetTraceabilityV2",
        admin
      )) as AssetTraceabilityV2__factory

      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        factoryV2
      )
      await upgraded.waitForDeployment()

      const contractImplAddrV2 =
        await upgrades.erc1967.getImplementationAddress(
          await proxy.getAddress()
        )
      expect(contractImplAddrV2).to.not.equal(contractImplAddrV1)

      const contractV2 = factory.attach(
        await proxy.getAddress()
      ) as AssetTraceabilityV2
      expect(await contractV2.getBaseURI()).to.equal("v2")
    })
  })

  describe("Base URI", () => {
    it("reverts if modification is called by non owner", async function () {
      const { contract, users } = await loadFixture(initContract)
      await expect(
        contract.connect(users[0]).setBaseURI(baseUri)
      ).to.be.revertedWith(REVERT_MESSAGES.ownable.callerNotOwner)
    })

    it("modifies base uri", async () => {
      const { contract } = await loadFixture(initContract)

      await contract.setBaseURI("ipfs://newuri")
      const result = await contract.getBaseURI()
      expect(result).to.be.equal("ipfs://newuri")
    })
  })

  describe("Unregistered tokens", () => {
    it("should have initialized values", async () => {
      const { contract } = await loadFixture(initContract)
      const result = await contract.getAsset(9999)
      expect(result.amount).to.be.equal(0)
    })
  })

  describe("Mint", () => {
    const assetData = {
      relative_uri: "algo_urimetadata_asset_1",
      amount: 22,
      group: 1,
      _type: 2
    }

    it("should mint a new asset", async () => {
      const { contract, users, createTokenForUser } =
        await loadFixture(initContract)

      const createdTokenId = await createTokenForUser(users[0], {
        relativeUri: assetData.relative_uri,
        amount: assetData.amount,
        _type: assetData._type,
        _group: assetData.group
      })

      const tokenUri = await contract.tokenURI(createdTokenId)
      expect(tokenUri).to.be.equal(`${baseUri}${assetData.relative_uri}`)

      const newAsset = await contract.getAsset(createdTokenId)
      expect(newAsset.amount).to.be.equal(assetData.amount)
      expect(newAsset.parents).to.be.an("array").that.is.empty
      expect(newAsset.children).to.be.an("array").that.is.empty
      expect(newAsset.changes[0].reason).to.equal(OperationType.Registration)
    })
  })

  it("should get group ", async () => {
    const { contract, users, createTokenForUser } =
      await loadFixture(initContract)

    const testedGroupId = 15n
    await createTokenForUser(users[1], {
      _group: testedGroupId
    })
    await createTokenForUser(users[1], {
      _group: testedGroupId
    })

    const result = await contract.getGroup(testedGroupId)
    expect(result.length).to.be.equal(2)
  })

  describe("Metadata update", function () {
    it("Reverts if not called by token owner", async function () {
      const { contract, testToken, otherUsers } =
        await loadFixture(registerOneToken)

      await expect(contract.connect(otherUsers[0]).editMetadata(testToken, ""))
        .to.be.revertedWithCustomError(contract, "InvalidCaller")
        .withArgs(testToken)
    })

    it("Reverts if token does not exist", async function () {
      const { contract, admin } = await loadFixture(initContract)
      await expect(
        contract.connect(admin).editMetadata(10001, "")
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Properly assigns the new metadata value", async function () {
      const { testToken, contract, tokenOwner } =
        await loadFixture(registerOneToken)

      const prevResult = await contract.tokenURI(testToken)
      expect(prevResult).to.be.equal(`${baseUri}whateverUri`)

      await contract.connect(tokenOwner).editMetadata(testToken, "newuri")

      const result = await contract.tokenURI(testToken)
      expect(result).to.equal(`${baseUri}newuri`)
    })

    it("Reverts if token was already used", async function () {
      const { testToken, contract, tokenOwner } =
        await loadFixture(registerOneToken)

      // First call before transformation works
      await contract.connect(tokenOwner).editMetadata(testToken, "newUri")

      // Call to use tokens
      await contract
        .connect(tokenOwner)
        .transform(testToken, 1, 34, 700, "transformedUri")

      // Second call should not work
      await expect(
        contract.connect(tokenOwner).editMetadata(testToken, "newUri2")
      )
        .to.be.revertedWithCustomError(contract, "TokenAlreadyUsed")
        .withArgs(testToken)
    })
  })

  describe("Transfer", function () {
    it("Reverts if called by non owner", async function () {
      const { tokenOwner, otherUsers, testToken, contract } =
        await loadFixture(registerOneToken)

      await expect(
        contract
          .connect(otherUsers[0])
          [
            "safeTransferFrom(address,address,uint256)"
          ](await tokenOwner.getAddress(), await otherUsers[1].getAddress(), testToken)
      )
        .to.be.revertedWithCustomError(contract, "InvalidCaller")
        .withArgs(testToken)
    })

    it("Reverts if token does not exist", async function () {
      const { otherUsers, contract } = await loadFixture(registerOneToken)

      await expect(
        contract["safeTransferFrom(address,address,uint256)"](
          await otherUsers[0].getAddress(),
          await otherUsers[1].getAddress(),
          20002
        )
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Owner transfers token from an account to another", async function () {
      const { tokenOwner, otherUsers, testToken, contract } =
        await loadFixture(registerOneToken)

      await contract["safeTransferFrom(address,address,uint256)"](
        await tokenOwner.getAddress(),
        await otherUsers[0].getAddress(),
        testToken
      )

      expect(await contract.ownerOf(testToken)).to.equal(
        await otherUsers[0].getAddress()
      )

      const asset = await contract.getAsset(testToken)
      expect(asset.changes.length).to.equal(2)
      expect(asset.changes[1].reason).to.equal(OperationType.Transfer)
    })

    it("Operator transfers token from an account to another", async function () {
      const { tokenOwner, otherUsers, testToken, contract } =
        await loadFixture(registerOneToken)

      const operator = otherUsers[0]

      await contract
        .connect(tokenOwner)
        .approve(await operator.getAddress(), testToken)

      const transfer = contract
        .connect(operator)
        [
          "safeTransferFrom(address,address,uint256)"
        ](await tokenOwner.getAddress(), await otherUsers[1].getAddress(), testToken)

      await expect(transfer)
        .to.emit(contract, "Transfer")
        .withArgs(
          await tokenOwner.getAddress(),
          await otherUsers[1].getAddress(),
          testToken
        )
    })
  })

  describe("Transform", function () {
    let tokenOwner: AbstractSigner,
      notOwner: AbstractSigner,
      operator: AbstractSigner
    let transformedToken: BigNumberish
    let assetTraceabilityContract: AssetTraceability

    beforeEach(async function () {
      const {
        tokenOwner: towner,
        otherUsers,
        testToken,
        contract
      } = await loadFixture(registerOneToken)

      tokenOwner = towner
      operator = otherUsers[0]
      notOwner = otherUsers[1]
      transformedToken = testToken
      assetTraceabilityContract = contract

      // Allow user to operate with tokens to be merged
      await contract
        .connect(tokenOwner)
        .approve(await operator.getAddress(), transformedToken)
    })

    it("Reverts if not called by token owner", async function () {
      await expect(
        assetTraceabilityContract
          .connect(notOwner)
          .transform(transformedToken, 1, 34, 700, "")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(transformedToken)
    })

    it("Reverts if contract owner has not been approved to operate with the token", async function () {
      // Disallow admin to operate with tokens to be merged
      await assetTraceabilityContract
        .connect(tokenOwner)
        .approve(ZeroAddress, transformedToken) // Only one account per caller, so the operator is invalidated

      await expect(
        assetTraceabilityContract
          .connect(operator)
          .transform(transformedToken, 1, 34, 700, "")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(transformedToken)
    })

    it("Reverts if any of the merged tokens do not exist", async function () {
      const notExistingTokenId = 999

      await expect(
        assetTraceabilityContract
          .connect(operator)
          .transform(notExistingTokenId, 1, 34, 700, "")
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Transforms one token into a new one", async function () {
      const transformationTx = await assetTraceabilityContract
        .connect(operator)
        .transform(transformedToken, 77, 34, 700, "transformedUri")
      const [newId] = await extractCreatedTokenIds(
        assetTraceabilityContract,
        transformationTx
      )
      const newAsset = await assetTraceabilityContract.getAsset(newId)

      expect(newAsset.tokenId).to.equal(newId)
      expect(newAsset.amount).to.equal(77)
      expect(newAsset._type).to.equal(34)
      expect(newAsset.groupId).to.equal(700)
      expect(newAsset.uri).to.equal(`${baseUri}transformedUri`)
      expectEqualBNArray(newAsset.parents, [transformedToken])
      expect(newAsset.children).to.be.an("array").that.is.empty

      const mergedAsset =
        await assetTraceabilityContract.getAsset(transformedToken)
      expectEqualBNArray(mergedAsset.parents, [newId])
      expect(mergedAsset.parents).to.be.an("array").that.is.empty

      const asset = await assetTraceabilityContract.getAsset(newAsset.tokenId)
      expect(asset.changes.length).to.equal(1)
      expect(asset.changes[0].reason).to.equal(OperationType.Transformation)
    })

    it("Reverts if the merged tokens were already used", async function () {
      // First call to use tokens
      await assetTraceabilityContract
        .connect(operator)
        .transform(transformedToken, 1, 34, 700, "transformedUri")

      // Second call should not work
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .transform(transformedToken, 1, 34, 700, "transformedUri")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "TokenAlreadyUsed"
        )
        .withArgs(transformedToken)
    })
  })

  describe("Union", function () {
    let tokenOwner: AbstractSigner,
      operator: AbstractSigner,
      notOwner: AbstractSigner,
      newOwner: AbstractSigner
    let mergedTokens: Array<BigNumberish>
    let assetTraceabilityContract: AssetTraceability

    beforeEach(async function () {
      const { contract, users, createTokenForUser, allowToOperate } =
        await loadFixture(initContract)

      tokenOwner = users[0]
      operator = users[1]
      notOwner = users[2]
      newOwner = users[3]
      assetTraceabilityContract = contract

      mergedTokens = [
        await createTokenForUser(tokenOwner),
        await createTokenForUser(tokenOwner),
        await createTokenForUser(tokenOwner)
      ]
      await allowToOperate(
        tokenOwner,
        await operator.getAddress(),
        mergedTokens
      )
    })

    it("Reverts if not called by token owner or by an approved operator", async function () {
      await expect(
        assetTraceabilityContract
          .connect(notOwner) // not operator either
          .union(await newOwner.getAddress(), 12, 44, mergedTokens, "")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(mergedTokens[0])
    })

    it("Reverts if any of the merged tokens do not exist", async function () {
      const notExistingTokenId = 999

      await expect(
        assetTraceabilityContract
          .connect(operator)
          .union(
            await newOwner.getAddress(),
            12,
            44,
            [...mergedTokens, notExistingTokenId],
            ""
          )
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Mixes multiple tokens", async function () {
      const unionTx = await assetTraceabilityContract
        .connect(operator)
        .union(await newOwner.getAddress(), 12, 44, mergedTokens, "mergedUri")
      const [newId] = await extractCreatedTokenIds(
        assetTraceabilityContract,
        unionTx
      )
      const newAsset = await assetTraceabilityContract.getAsset(newId)

      let totalMergedAmount = 0n
      for (let tokenId of mergedTokens) {
        const { amount } = await assetTraceabilityContract.getAsset(tokenId)
        totalMergedAmount += amount
      }

      expect(newAsset.tokenId).to.equal(newId)
      expect(newAsset._type).to.equal(12)
      expect(newAsset.groupId).to.equal(44)
      expect(newAsset.uri).to.equal(`${baseUri}mergedUri`)
      expect(newAsset.amount).to.equal(totalMergedAmount)
      expectEqualBNArray(newAsset.parents, mergedTokens)
      expect(newAsset.children).to.be.an("array").that.is.empty

      const asset = await assetTraceabilityContract.getAsset(newId)
      expect(asset.changes.length).to.equal(1)
      expect(asset.changes[0].reason).to.equal(OperationType.Union)

      for (let mergedId of mergedTokens) {
        const mergedAsset = await assetTraceabilityContract.getAsset(mergedId)
        expectEqualBNArray(mergedAsset.parents, [newId])
        expect(mergedAsset.parents).to.be.an("array").that.is.empty
      }
    })

    it("Reverts if the merged tokens were already used", async function () {
      // First call to use tokens
      await assetTraceabilityContract
        .connect(operator)
        .union(await newOwner.getAddress(), 12, 44, mergedTokens, "")

      // Second call should not work
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .union(await newOwner.getAddress(), 12, 44, mergedTokens, "")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "TokenAlreadyUsed"
        )
        .withArgs(mergedTokens[0])
    })
  })

  describe("Add", function () {
    const TYPE = 21n
    const GROUP_ID = 31n

    let tokenOwner: AbstractSigner,
      operator: AbstractSigner,
      notOwner: AbstractSigner
    let updatedToken: BigNumberish
    let mergedTokens: Array<BigNumberish>
    let assetTraceabilityContract: AssetTraceability
    let disallowOperation: (token: BigNumberish) => Promise<void>

    beforeEach(async function () {
      const { contract, users, createTokenForUser, allowToOperate } =
        await loadFixture(initContract)

      tokenOwner = users[0]
      operator = users[1]
      notOwner = users[2]
      assetTraceabilityContract = contract

      updatedToken = await createTokenForUser(tokenOwner, {
        _type: TYPE,
        _group: GROUP_ID
      })

      mergedTokens = [
        await createTokenForUser(tokenOwner),
        await createTokenForUser(tokenOwner),
        await createTokenForUser(tokenOwner)
      ]

      await allowToOperate(tokenOwner, await operator.getAddress(), [
        updatedToken,
        ...mergedTokens
      ])

      // Disallow admin to operate with token 0
      disallowOperation = token =>
        allowToOperate(tokenOwner, ZeroAddress, [token])
    })

    it("Reverts if not called by token owner or by an approved operator", async function () {
      await expect(
        assetTraceabilityContract
          .connect(notOwner) // not operator either
          .add(updatedToken, mergedTokens)
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(updatedToken)

      await disallowOperation(mergedTokens[0])
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .add(updatedToken, mergedTokens)
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(mergedTokens[0])
    })

    it("Reverts if any of the merged tokens do not exist", async function () {
      const notExistingTokenId = 999

      await expect(
        assetTraceabilityContract
          .connect(operator)
          .add(updatedToken, [...mergedTokens, notExistingTokenId])
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Adds tokens to existing one", async function () {
      const { amount: initialAmount } =
        await assetTraceabilityContract.getAsset(updatedToken)
      let totalMergedAmount = initialAmount

      await assetTraceabilityContract
        .connect(operator)
        .add(updatedToken, mergedTokens)

      for (let tokenId of mergedTokens) {
        const { amount } = await assetTraceabilityContract.getAsset(tokenId)
        totalMergedAmount += amount
      }

      const newAsset = await assetTraceabilityContract.getAsset(updatedToken)
      expect(newAsset._type).to.equal(TYPE)
      expect(newAsset.groupId).to.equal(GROUP_ID)
      expect(newAsset.uri).to.equal(`${baseUri}whateverUri`)
      expect(newAsset.amount).to.equal(totalMergedAmount)
      expectEqualBNArray(newAsset.parents, mergedTokens)
      expect(newAsset.children).to.be.an("array").that.is.empty

      const asset = await assetTraceabilityContract.getAsset(updatedToken)
      expect(asset.changes.length).to.equal(2) // Should we log addition so it is 2?
      expect(asset.changes[1].reason).to.equal(OperationType.Addition)

      for (let mergedId of mergedTokens) {
        const mergedAsset = await assetTraceabilityContract.getAsset(mergedId)
        expectEqualBNArray(mergedAsset.parents, [updatedToken])
        expect(mergedAsset.parents).to.be.an("array").that.is.empty
      }
    })

    it("Reverts if the merged tokens were already used", async function () {
      // First call to use tokens
      await assetTraceabilityContract
        .connect(operator)
        .add(updatedToken, mergedTokens)

      // Second call should not work
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .add(updatedToken, mergedTokens)
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "TokenAlreadyUsed"
        )
        .withArgs(mergedTokens[0])
    })
  })

  describe("Split in different chunks", function () {
    const ORIGINAL_AMOUNT = 100,
      NEW_TYPE = 789,
      NEW_GROUP = 254
    let tokenOwner: AbstractSigner,
      operator: AbstractSigner,
      notOwner: AbstractSigner
    let splitToken: BigNumberish
    let assetTraceabilityContract: AssetTraceability
    let disallowOperation: (token: BigNumberish) => Promise<void>

    beforeEach(async function () {
      const { contract, users, createTokenForUser, allowToOperate } =
        await loadFixture(initContract)

      tokenOwner = users[0]
      operator = users[1]
      notOwner = users[2]
      assetTraceabilityContract = contract

      splitToken = await createTokenForUser(tokenOwner, {
        amount: ORIGINAL_AMOUNT
      })

      await allowToOperate(tokenOwner, await operator.getAddress(), [
        splitToken
      ])

      // Disallow admin to operate with token 0
      disallowOperation = token =>
        allowToOperate(tokenOwner, ZeroAddress, [token])
    })

    it("Reverts if not called by token owner or by an approved operator", async function () {
      await expect(
        assetTraceabilityContract
          .connect(notOwner) // not operator either
          .splitDifferent(
            splitToken,
            NEW_TYPE,
            NEW_GROUP,
            [50, 50],
            ["uri1", "uri2"]
          )
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(splitToken)

      await disallowOperation(splitToken)
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(
            splitToken,
            NEW_TYPE,
            NEW_GROUP,
            [50, 50],
            ["uri1", "uri2"]
          )
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(splitToken)
    })

    it("Reverts if token does not exist", async function () {
      const notExistingTokenId = 999
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(
            notExistingTokenId,
            NEW_TYPE,
            NEW_GROUP,
            [50, 50],
            ["uri1", "uri2"]
          )
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Reverts if amount and URI array lengths do not match", async function () {
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(
            splitToken,
            NEW_TYPE,
            NEW_GROUP,
            [50, 50, 50],
            ["uri1", "uri2"]
          )
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "NotMatchingArrays"
        )
        .withArgs(3, 2)
    })

    it("Reverts if amounts do not add up to the split token amount", async function () {
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(
            splitToken,
            NEW_TYPE,
            NEW_GROUP,
            [50, 40, 11],
            ["uri1", "uri2", "uri3"]
          )
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "NotMatchingAmount"
        )
        .withArgs(100, 101)
    })

    it("Split token into defined amounts", async function () {
      const amounts = [50, 10, 10, 10, 20]
      const uris = amounts.map((_, i) => `uri${i}`)

      await assetTraceabilityContract
        .connect(operator)
        .splitDifferent(splitToken, NEW_TYPE, NEW_GROUP, amounts, uris)

      const { children } = await assetTraceabilityContract.getAsset(splitToken)
      let i = 0
      for (let childId of children) {
        const newAsset = await assetTraceabilityContract.getAsset(childId)
        expect(newAsset._type).to.equal(NEW_TYPE)
        expect(newAsset.groupId).to.equal(NEW_GROUP)
        expect(newAsset.uri).to.equal(`${baseUri}uri${i}`)
        expect(newAsset.amount).to.equal(amounts[i])
        expectEqualBNArray(newAsset.parents, [splitToken])
        expect(newAsset.children).to.be.an("array").that.is.empty

        const asset = await assetTraceabilityContract.getAsset(childId)
        expect(asset.changes.length).to.equal(1)
        expect(asset.changes[0].reason).to.equal(OperationType.Split)

        i += 1
      }
    })

    it("Reverts if the merged tokens were already used", async function () {
      const amounts = [50, 10, 10, 10, 20]
      const uris = amounts.map((_, i) => `http://uri${i}`)

      // First call to use tokens
      await assetTraceabilityContract
        .connect(operator)
        .splitDifferent(splitToken, NEW_TYPE, NEW_GROUP, amounts, uris)

      // Second call should not work
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(splitToken, NEW_TYPE, NEW_GROUP, amounts, uris)
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "TokenAlreadyUsed"
        )
        .withArgs(splitToken)
    })
  })

  describe("Split in tokens with same amount", function () {
    const ORIGINAL_AMOUNT = 100,
      NEW_TYPE = 789,
      NEW_GROUP = 254
    let tokenOwner: AbstractSigner,
      operator: AbstractSigner,
      notOwner: AbstractSigner
    let splitToken: BigNumberish
    let assetTraceabilityContract: AssetTraceability
    let disallowOperation: (token: BigNumberish) => Promise<void>

    beforeEach(async function () {
      const { contract, users, createTokenForUser, allowToOperate } =
        await loadFixture(initContract)

      tokenOwner = users[0]
      operator = users[1]
      notOwner = users[2]
      assetTraceabilityContract = contract

      splitToken = await createTokenForUser(tokenOwner, {
        amount: ORIGINAL_AMOUNT
      })

      await allowToOperate(tokenOwner, await operator.getAddress(), [
        splitToken
      ])

      // Disallow admin to operate with token 0
      disallowOperation = token =>
        allowToOperate(tokenOwner, ZeroAddress, [token])
    })

    it("Reverts if not called by token owner or by an approved operator", async function () {
      await expect(
        assetTraceabilityContract
          .connect(notOwner) // not operator either
          .splitSame(splitToken, NEW_TYPE, NEW_GROUP, 10, "uri")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(splitToken)

      // Disallow admin to operate with split token
      await disallowOperation(splitToken)
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitSame(splitToken, NEW_TYPE, NEW_GROUP, 10, "uri")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "InvalidCaller"
        )
        .withArgs(splitToken)
    })

    it("Reverts if token does not exist", async function () {
      const notExistingTokenId = 999
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitSame(notExistingTokenId, NEW_TYPE, NEW_GROUP, 10, "uri")
      ).to.be.revertedWith(REVERT_MESSAGES.erc721.invalidToken)
    })

    it("Reverts if token has remaining amount", async function () {
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitSame(splitToken, NEW_TYPE, NEW_GROUP, 11, "uri")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "NotMatchingAmount"
        )
        .withArgs(100, 99)
    })

    it("Split token into new tokens with defined amount", async function () {
      const splitAmount = 5
      const numberOfNewTokens = ORIGINAL_AMOUNT / 5

      await assetTraceabilityContract
        .connect(operator)
        .splitSame(splitToken, NEW_TYPE, NEW_GROUP, splitAmount, "uri")

      const { children } = await assetTraceabilityContract.getAsset(splitToken)
      expect(children.length).to.equal(numberOfNewTokens)

      for (let childId of children) {
        const newAsset = await assetTraceabilityContract.getAsset(childId)
        expect(newAsset._type).to.equal(NEW_TYPE)
        expect(newAsset.groupId).to.equal(NEW_GROUP)
        expect(newAsset.uri).to.equal(`${baseUri}uri`)
        expect(newAsset.amount).to.equal(splitAmount)
        expectEqualBNArray(newAsset.parents, [splitToken])
        expect(newAsset.children).to.be.an("array").that.is.empty

        const asset = await assetTraceabilityContract.getAsset(childId)
        expect(asset.changes.length).to.equal(1)
        expect(asset.changes[0].reason).to.equal(OperationType.Split)
      }
    })

    it("Reverts if less amount than the minimum expected amount", async function () {
      const splitAmount = ORIGINAL_AMOUNT * 10

      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitSame(splitToken, NEW_TYPE, NEW_GROUP, splitAmount, "uri")
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "NotMatchingAmount"
        )
        .withArgs(splitAmount, ORIGINAL_AMOUNT)
    })

    it("Reverts if the merged tokens were already used", async function () {
      const amounts = [50, 10, 10, 10, 20]
      const uris = amounts.map((_, i) => `http://uri${i}`)

      // First call to use tokens
      await assetTraceabilityContract
        .connect(operator)
        .splitDifferent(splitToken, NEW_TYPE, NEW_GROUP, amounts, uris)

      // Second call should not work
      await expect(
        assetTraceabilityContract
          .connect(operator)
          .splitDifferent(splitToken, NEW_TYPE, NEW_GROUP, amounts, uris)
      )
        .to.be.revertedWithCustomError(
          assetTraceabilityContract,
          "TokenAlreadyUsed"
        )
        .withArgs(splitToken)
    })
  })
})

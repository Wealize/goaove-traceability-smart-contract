// utils.ts
// COPYRIGHT: FUNDACIÓN TECNALIA RESEARCH & INNOVATION, 2024.
// By virtue of the outsourcing agreement of the project ZL-2021/00717, with acronym N0WASTE, this file becomes property of IZERTIS S.A. (VAT A-33845009).
// Licensed to TECNALIA under the following conditions: non-exclusive, irrevocable, transferable, sublicensable, and royalty free.
// This license is effective without end date.

import { expect } from "chai"
import {
  BigNumberish,
  ZeroAddress,
  AbstractSigner,
  ContractTransactionResponse
} from "ethers"
import { AssetTraceability } from "typechain-types"

const OperationType = {
  Registration: 0, // default value
  Addition: 1,
  Split: 2,
  Union: 3,
  Transformation: 4,
  Transfer: 5
}

async function getRegisteredTokenIds(
  assetTraceabilityContract: AssetTraceability,
  blockNumber: string | number | undefined,
  toAddress?: string // If undefined === anyone
): Promise<Array<bigint>> {
  const events = await assetTraceabilityContract.queryFilter(
    assetTraceabilityContract.filters.Transfer(ZeroAddress, toAddress),
    blockNumber
  )
  return events.map(e => e.args[2])
}

async function extractCreatedTokenIds(
  assetTraceabilityContract: AssetTraceability,
  ...transferTxs: ContractTransactionResponse[]
): Promise<Array<BigNumberish>> {
  const confirmations = await Promise.all(
    transferTxs.map(async t => {
      const c = await t.wait()
      return getRegisteredTokenIds(assetTraceabilityContract, c!.blockNumber)
    })
  )

  return confirmations.flat().filter(tId => !!tId)
}

async function expectEqualBNArray(
  testArray: Array<BigNumberish>,
  expectedArray: Array<BigNumberish>
) {
  expect(testArray.every((e: any, i: number) => e == expectedArray[i])).to.true
}

type CreateTokenForUser = (
  user: AbstractSigner,
  optionalFields?: {
    relativeUri?: string
    amount?: BigNumberish
    _type?: BigNumberish
    _group?: BigNumberish
  }
) => Promise<bigint>

type BuildTokenCreator = (
  contract: AssetTraceability,
  admin: AbstractSigner,
  defaultType: BigNumberish,
  defaultGroup: BigNumberish
) => CreateTokenForUser

type AllowToOperate = (
  owner: AbstractSigner,
  operatorAddress: string,
  tokens: Array<BigNumberish>
) => Promise<void>

const buildTokenCreator: BuildTokenCreator =
  (contract, admin, defaultType, defaultGroup) =>
  async (user: AbstractSigner, optionalFields) => {
    let actualAmount = optionalFields?.amount || Math.floor(Math.random() * 100)
    const toAddr = await user.getAddress()
    const { blockNumber } = await contract
      .connect(admin)
      .register(
        toAddr,
        optionalFields?.relativeUri || "whateverUri",
        actualAmount,
        optionalFields?._type || defaultType,
        optionalFields?._group || defaultGroup
      )
    const [registeredId] = await getRegisteredTokenIds(
      contract,
      blockNumber!,
      toAddr
    )
    return registeredId
  }

export {
  buildTokenCreator,
  OperationType,
  CreateTokenForUser,
  AllowToOperate,
  expectEqualBNArray,
  extractCreatedTokenIds
}

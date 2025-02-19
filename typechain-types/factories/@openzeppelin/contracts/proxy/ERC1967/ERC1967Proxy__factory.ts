/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BytesLike,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { PayableOverrides } from "../../../../../common";
import type {
  ERC1967Proxy,
  ERC1967ProxyInterface,
} from "../../../../../@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

const _bytecode =
  "0x608060405260405161084f38038061084f833981016040819052610022916103d8565b6100378282600064010000000061003e810204565b50506104f6565b61005083640100000000610080810204565b60008251118061005d5750805b1561007b5761007983836401000000006100296100c982021704565b505b505050565b610092816401000000006100fe810204565b604051600160a060020a038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606100f78383604051806060016040528060278152602001610828602791396401000000006101fd810204565b9392505050565b6101148164010000000061005561028482021704565b6101a5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e74726163740000000000000000000000000000000000000060648201526084015b60405180910390fd5b806101dc7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc64010000000061007161029382021704565b8054600160a060020a031916600160a060020a039290921691909117905550565b606060008085600160a060020a03168560405161021a91906104a7565b600060405180830381855af49150503d8060008114610255576040519150601f19603f3d011682016040523d82523d6000602084013e61025a565b606091505b509150915061027a86838387610296640100000000026401000000009004565b9695505050505050565b600160a060020a03163b151590565b90565b6060831561032657825160000361031f576102b985640100000000610284810204565b61031f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161019c565b5081610339565b6103398383640100000000610341810204565b949350505050565b8151156103515781518083602001fd5b806040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161019c91906104c3565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60005b838110156103cf5781810151838201526020016103b7565b50506000910152565b600080604083850312156103eb57600080fd5b8251600160a060020a038116811461040257600080fd5b602084015190925067ffffffffffffffff8082111561042057600080fd5b818501915085601f83011261043457600080fd5b81518181111561044657610446610385565b604051601f8201601f19908116603f0116810190838211818310171561046e5761046e610385565b8160405282815288602084870101111561048757600080fd5b6104988360208301602088016103b4565b80955050505050509250929050565b600082516104b98184602087016103b4565b9190910192915050565b60208152600082518060208401526104e28160408501602087016103b4565b601f01601f19169190910160400192915050565b610323806105056000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610074565b6100b9565b565b606061004e83836040518060600160405280602781526020016102c7602791396100dd565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b3660008037600080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b60606000808573ffffffffffffffffffffffffffffffffffffffff16856040516101079190610277565b600060405180830381855af49150503d8060008114610142576040519150601f19603f3d011682016040523d82523d6000602084013e610147565b606091505b509150915061015886838387610162565b9695505050505050565b606083156101fd5782516000036101f65773ffffffffffffffffffffffffffffffffffffffff85163b6101f6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064015b60405180910390fd5b5081610207565b610207838361020f565b949350505050565b81511561021f5781518083602001fd5b806040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101ed9190610293565b60005b8381101561026e578181015183820152602001610256565b50506000910152565b60008251610289818460208701610253565b9190910192915050565b60208152600082518060208401526102b2816040850160208701610253565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220e88a3485c2e67ef3755d807cca4e826a7d5629dd1f53158ce6321a0c5492e19964736f6c63430008110033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564";

type ERC1967ProxyConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC1967ProxyConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC1967Proxy__factory extends ContractFactory {
  constructor(...args: ERC1967ProxyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _logic: AddressLike,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_logic, _data, overrides || {});
  }
  override deploy(
    _logic: AddressLike,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string }
  ) {
    return super.deploy(_logic, _data, overrides || {}) as Promise<
      ERC1967Proxy & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): ERC1967Proxy__factory {
    return super.connect(runner) as ERC1967Proxy__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC1967ProxyInterface {
    return new Interface(_abi) as ERC1967ProxyInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): ERC1967Proxy {
    return new Contract(address, _abi, runner) as unknown as ERC1967Proxy;
  }
}

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../../common";
import type {
  ERC721Upgradeable,
  ERC721UpgradeableInterface,
} from "../../../../../@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5061129c806100206000396000f3fe608060405234801561001057600080fd5b50600436106100ec576000357c0100000000000000000000000000000000000000000000000000000000900480636352211e116100a9578063a22cb46511610083578063a22cb465146101d0578063b88d4fde146101e3578063c87b56dd146101f6578063e985e9c51461020957600080fd5b80636352211e1461019457806370a08231146101a757806395d89b41146101c857600080fd5b806301ffc9a7146100f157806306fdde0314610119578063081812fc1461012e578063095ea7b31461015957806323b872dd1461016e57806342842e0e14610181575b600080fd5b6101046100ff366004610dc4565b610245565b60405190151581526020015b60405180910390f35b6101216102e2565b6040516101109190610e31565b61014161013c366004610e44565b610374565b604051600160a060020a039091168152602001610110565b61016c610167366004610e79565b61039b565b005b61016c61017c366004610ea3565b6104d7565b61016c61018f366004610ea3565b61050b565b6101416101a2366004610e44565b610526565b6101ba6101b5366004610edf565b61058e565b604051908152602001610110565b61012161062b565b61016c6101de366004610efa565b61063a565b61016c6101f1366004610f65565b610649565b610121610204366004610e44565b610684565b610104610217366004611041565b600160a060020a039182166000908152606a6020908152604080832093909416825291909152205460ff1690565b6000600160e060020a031982167f80ac58cd0000000000000000000000000000000000000000000000000000000014806102a85750600160e060020a031982167f5b5e139f00000000000000000000000000000000000000000000000000000000145b806102dc57507f01ffc9a700000000000000000000000000000000000000000000000000000000600160e060020a03198316145b92915050565b6060606580546102f190611074565b80601f016020809104026020016040519081016040528092919081815260200182805461031d90611074565b801561036a5780601f1061033f5761010080835404028352916020019161036a565b820191906000526020600020905b81548152906001019060200180831161034d57829003601f168201915b5050505050905090565b600061037f826106f8565b50600090815260696020526040902054600160a060020a031690565b60006103a682610526565b905080600160a060020a031683600160a060020a0316036104375760405160e560020a62461bcd02815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e6560448201527f720000000000000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b33600160a060020a038216148061045357506104538133610217565b6104c85760405160e560020a62461bcd02815260206004820152603d60248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f7420746f60448201527f6b656e206f776e6572206f7220617070726f76656420666f7220616c6c000000606482015260840161042e565b6104d28383610762565b505050565b6104e133826107dd565b6105005760405160e560020a62461bcd02815260040161042e906110c7565b6104d283838361085c565b6104d283838360405180602001604052806000815250610649565b600081815260676020526040812054600160a060020a0316806102dc5760405160e560020a62461bcd02815260206004820152601860248201527f4552433732313a20696e76616c696420746f6b656e2049440000000000000000604482015260640161042e565b6000600160a060020a03821661060f5760405160e560020a62461bcd02815260206004820152602960248201527f4552433732313a2061646472657373207a65726f206973206e6f74206120766160448201527f6c6964206f776e65720000000000000000000000000000000000000000000000606482015260840161042e565b50600160a060020a031660009081526068602052604090205490565b6060606680546102f190611074565b6106453383836109ef565b5050565b61065333836107dd565b6106725760405160e560020a62461bcd02815260040161042e906110c7565b61067e84848484610ac0565b50505050565b606061068f826106f8565b60006106a660408051602081019091526000815290565b905060008151116106c657604051806020016040528060008152506106f1565b806106d084610af6565b6040516020016106e1929190611124565b6040516020818303038152906040525b9392505050565b600081815260676020526040902054600160a060020a031661075f5760405160e560020a62461bcd02815260206004820152601860248201527f4552433732313a20696e76616c696420746f6b656e2049440000000000000000604482015260640161042e565b50565b6000818152606960205260409020805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03841690811790915581906107a482610526565b600160a060020a03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b6000806107e983610526565b905080600160a060020a031684600160a060020a031614806108305750600160a060020a038082166000908152606a602090815260408083209388168352929052205460ff165b80610854575083600160a060020a031661084984610374565b600160a060020a0316145b949350505050565b82600160a060020a031661086f82610526565b600160a060020a0316146108985760405160e560020a62461bcd02815260040161042e90611153565b600160a060020a0382166109165760405160e560020a62461bcd028152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f2061646460448201527f7265737300000000000000000000000000000000000000000000000000000000606482015260840161042e565b82600160a060020a031661092982610526565b600160a060020a0316146109525760405160e560020a62461bcd02815260040161042e90611153565b6000818152606960209081526040808320805473ffffffffffffffffffffffffffffffffffffffff19908116909155600160a060020a0387811680865260688552838620805460001901905590871680865283862080546001019055868652606790945282852080549092168417909155905184937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b81600160a060020a031683600160a060020a031603610a535760405160e560020a62461bcd02815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c657200000000000000604482015260640161042e565b600160a060020a038381166000818152606a6020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b610acb84848461085c565b610ad784848484610b96565b61067e5760405160e560020a62461bcd02815260040161042e906111b0565b60606000610b0383610ccc565b600101905060008167ffffffffffffffff811115610b2357610b23610f36565b6040519080825280601f01601f191660200182016040528015610b4d576020820181803683370190505b5090508181016020015b600019017f3031323334353637383961626364656600000000000000000000000000000000600a86061a8153600a8504945084610b5757509392505050565b6000600160a060020a0384163b15610cc1576040517f150b7a02000000000000000000000000000000000000000000000000000000008152600160a060020a0385169063150b7a0290610bf390339089908890889060040161120d565b6020604051808303816000875af1925050508015610c2e575060408051601f3d908101601f19168201909252610c2b91810190611249565b60015b610c8e573d808015610c5c576040519150601f19603f3d011682016040523d82523d6000602084013e610c61565b606091505b508051600003610c865760405160e560020a62461bcd02815260040161042e906111b0565b805181602001fd5b600160e060020a0319167f150b7a0200000000000000000000000000000000000000000000000000000000149050610854565b506001949350505050565b6000807a184f03e93ff9f4daa797ed6e38ed64bf6a1f0100000000000000008310610d15577a184f03e93ff9f4daa797ed6e38ed64bf6a1f010000000000000000830492506040015b6d04ee2d6d415b85acef81000000008310610d41576d04ee2d6d415b85acef8100000000830492506020015b662386f26fc100008310610d5f57662386f26fc10000830492506010015b6305f5e1008310610d77576305f5e100830492506008015b6127108310610d8b57612710830492506004015b60648310610d9d576064830492506002015b600a83106102dc5760010192915050565b600160e060020a03198116811461075f57600080fd5b600060208284031215610dd657600080fd5b81356106f181610dae565b60005b83811015610dfc578181015183820152602001610de4565b50506000910152565b60008151808452610e1d816020860160208601610de1565b601f01601f19169290920160200192915050565b6020815260006106f16020830184610e05565b600060208284031215610e5657600080fd5b5035919050565b8035600160a060020a0381168114610e7457600080fd5b919050565b60008060408385031215610e8c57600080fd5b610e9583610e5d565b946020939093013593505050565b600080600060608486031215610eb857600080fd5b610ec184610e5d565b9250610ecf60208501610e5d565b9150604084013590509250925092565b600060208284031215610ef157600080fd5b6106f182610e5d565b60008060408385031215610f0d57600080fd5b610f1683610e5d565b915060208301358015158114610f2b57600080fd5b809150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008060008060808587031215610f7b57600080fd5b610f8485610e5d565b9350610f9260208601610e5d565b925060408501359150606085013567ffffffffffffffff80821115610fb657600080fd5b818701915087601f830112610fca57600080fd5b813581811115610fdc57610fdc610f36565b604051601f8201601f19908116603f0116810190838211818310171561100457611004610f36565b816040528281528a602084870101111561101d57600080fd5b82602086016020830137600060208483010152809550505050505092959194509250565b6000806040838503121561105457600080fd5b61105d83610e5d565b915061106b60208401610e5d565b90509250929050565b60028104600182168061108857607f821691505b6020821081036110c1577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b6020808252602d908201527f4552433732313a2063616c6c6572206973206e6f7420746f6b656e206f776e6560408201527f72206f7220617070726f76656400000000000000000000000000000000000000606082015260800190565b60008351611136818460208801610de1565b83519083019061114a818360208801610de1565b01949350505050565b60208082526025908201527f4552433732313a207472616e736665722066726f6d20696e636f72726563742060408201527f6f776e6572000000000000000000000000000000000000000000000000000000606082015260800190565b60208082526032908201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560408201527f63656976657220696d706c656d656e7465720000000000000000000000000000606082015260800190565b6000600160a060020a0380871683528086166020840152508360408301526080606083015261123f6080830184610e05565b9695505050505050565b60006020828403121561125b57600080fd5b81516106f181610dae56fea26469706673582212201e8d3865b55a318dd0c3450f7beb844bc7aa94b00cb51b2f042c55132e1650b464736f6c63430008110033";

type ERC721UpgradeableConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC721UpgradeableConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC721Upgradeable__factory extends ContractFactory {
  constructor(...args: ERC721UpgradeableConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      ERC721Upgradeable & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): ERC721Upgradeable__factory {
    return super.connect(runner) as ERC721Upgradeable__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721UpgradeableInterface {
    return new Interface(_abi) as ERC721UpgradeableInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): ERC721Upgradeable {
    return new Contract(address, _abi, runner) as unknown as ERC721Upgradeable;
  }
}

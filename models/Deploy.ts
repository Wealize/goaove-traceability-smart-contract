import { BLOCKCHAIN } from "../configuration";

export type NetworkName = "hardhat" | "ganache" | "alastria";
export interface INetwork {
  chainId: number;
  name: NetworkName;
  url: string;
}

export const networks = new Map<number | undefined, INetwork>([
  [
    undefined,
    {
      chainId: BLOCKCHAIN.hardhat.chainId,
      name: "hardhat",
      url: `http://${BLOCKCHAIN.hardhat.hostname}:${BLOCKCHAIN.hardhat.port}`,
    },
  ], // Default hardhat
  [
    0,
    {
      chainId: BLOCKCHAIN.hardhat.chainId,
      name: "hardhat",
      url: `http://${BLOCKCHAIN.hardhat.hostname}:${BLOCKCHAIN.hardhat.port}`,
    },
  ], // Default hardhat
  [
    BLOCKCHAIN.hardhat.chainId,
    {
      chainId: BLOCKCHAIN.hardhat.chainId,
      name: "hardhat",
      url: `http://${BLOCKCHAIN.hardhat.hostname}:${BLOCKCHAIN.hardhat.port}`,
    },
  ],
  [
    BLOCKCHAIN.ganache.chainId,
    {
      chainId: BLOCKCHAIN.ganache.chainId,
      name: "ganache",
      url: `http://${BLOCKCHAIN.ganache.hostname}:${BLOCKCHAIN.ganache.port}`,
    },
  ],
  [
    BLOCKCHAIN.alastria.chainId,
    {
      chainId: BLOCKCHAIN.alastria.chainId,
      name: "alastria",
      url: BLOCKCHAIN.alastria.url,
    },
  ],
  [
    BLOCKCHAIN.alastriabesu.chainId,
    {
      chainId: BLOCKCHAIN.alastriabesu.chainId,
      name: "alastriabesu",
      url: BLOCKCHAIN.alastriabesu.url,
    },
  ],
]);

export interface IRegularDeployment {
  address: string;
  contractName?: string;
  deploymentType?: string;
  deployTxHash?: string;
  deployTimestamp?: Date | number | string;
  byteCodeHash?: string;
}

export interface IUpgradeDeployment {
  admin: string;
  proxy: string; // or storage
  logic: string; // or implementation
  contractName?: string;
  proxyTxHash?: string;
  logicTxHash?: string;
  deployTimestamp?: Date | number | string;
  upgradeTimestamp?: Date | number | string;
  byteCodeHash?: string;
}

export interface INetworkDeployment {
  network: {
    name: string;
    chainId: number | string;
  };
  smartContracts: {
    proxyAdmins?: IRegularDeployment[];
    contracts: (IUpgradeDeployment | IRegularDeployment)[];
  };
}

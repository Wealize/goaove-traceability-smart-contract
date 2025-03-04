//* Tasks Interfaces
export interface IGenerateWallets {
  relativePath?: string;
  password?: string;
  entropy?: string;
  privateKey?: string;
  mnemonicPhrase?: string;
  mnemonicPath?: string;
  mnemonicLocale?: string;
  batchSize?: number;
  type: string;
  connect: boolean;
}

export interface IGetWalletInfo {
  relativePath?: string;
  password: string;
  mnemonicPhrase?: string;
  mnemonicPath: string;
  mnemonicLocale: string;
  showPrivate: boolean;
}

export interface IGetMnemonic {
  relativePath: string;
  password: string;
}

export interface IDeploy {
  upgradeable: boolean;
  contractName: string;
  relativePath?: string;
  password: string;
  mnemonicPhrase?: string;
  mnemonicPath: string;
  mnemonicLocale: string;
  contractArgs: any;
  noCompile: boolean;
  txValue: number;
  initialize: boolean;
}

export interface IUpgrade {
  contractName: string;
  relativePath?: string;
  password: string;
  mnemonicPhrase?: string;
  mnemonicPath: string;
  mnemonicLocale: string;
  proxy: string;
  contractArgs: any;
  noCompile: boolean;
}

export interface ICallContract {
  contractName: string;
  contractAddress: string;
  functionName: string;
  functionArgs: any;
  artifactPath: string;
  relativePath?: string;
  password: string;
  mnemonicPhrase?: string;
  mnemonicPath: string;
  mnemonicLocale: string;
}

export interface IGetLogic {
  proxy: string;
  proxyAdmin?: string;
}

export interface IChangeLogic {
  proxy: string;
  proxyAdmin?: string;
  newLogic: string;
  relativePath?: string;
  password: string;
  mnemonicPhrase?: string;
  mnemonicPath: string;
  mnemonicLocale: string;
}
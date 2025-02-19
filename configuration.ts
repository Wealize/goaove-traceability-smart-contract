
type Hardfork = "london" | "berlin" | "byzantium";

/**
 * The KEYSTORE environment constant group is used to agrupate the constants related to the Encryped JSON wallets
 * @param root the root directory
 * @param default default constants if no specific ones defined
 * @param default.password to be used to symetric encryption & decryption of the Encryped JSON wallets
 * @param default.batchSize the number of Encryped JSON wallets to generate in batch mode
 * @param test constants related to tests
 * @param test.userNumber number of users to create in tests
 */
export const KEYSTORE = {
  root: "keystore",
  default: {
    accountNumber: 10, // Ganache server default account number
    balance: "0x2710", // infinite balance
    password: "PaSs_W0Rd", // should use another password for real things
    privateKey:
      "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
    mnemonic: {
      phrase:
        "myth like bonus scare over problem client lizard pioneer submit female collect",
      path: "m/44'/60'/0'/0/0",
      basePath: "m/44'/60'/0'/0",
      locale: "en",
    },
    batchSize: 2, // hardhat task default wallets to add to the keystore in batch mode
  },
};

/**
 * The BLOCKCHAIN environment constant group is used to agrupate the constants related to the blockchain network
 */
export const BLOCKCHAIN = {
  default: {
    solVersion: "0.8.17",
    evm: "berlin" as Hardfork,
    gasLimit: 10000000,
    gasPrice: 0,
    // maxFeePerGas: 900000000,
    // maxPriorityFeePerGas: 100,
    // initialBaseFeePerGas: 7,
  },
  hardhat: {
    chainId: 31337,
    hostname: "127.0.0.1",
    port: 8545,
  },
  ganache: {
    chainId: 1337,
    hostname: "127.0.0.1",
    port: 8545,
    //gasLimit: 6721975,
  },
  alastria: {
    chainId: 83584648538,
    url: "http://xx.xx.xx.xx:22000", // Wealize
    gasLimit: 30000000,
  },
  alastriabesu: {
    chainId: 2020,
    url: "http://xxxx:8545",
    gasLimit: 30000000,
  },
};

// default gas options to be used when sending Tx. It aims to zero gas price networks
export const GAS_OPT = {
  max: {
    gasLimit: BLOCKCHAIN.default.gasLimit,
    gasPrice: BLOCKCHAIN.default.gasPrice,
    // maxPriorityFeePerGas: BLOCKCHAIN.default.maxPriorityFeePerGas,
    // maxFeePerGas: BLOCKCHAIN.default.maxFeePerGas,
  },
};

export const DEPLOY = {
  deploymentsPath: "deployments.json",
};

export const CONTRACTS = {
  // Upgradeable Contracts
  proxyAdmin: {
    address: {
      hardhat: "",
      ganache: "",
      alastria: "",
    },
  },
  AssetTraceability: {
    name: "AssetTraceability",
    address: {
      hardhat: "",
      ganache: "",
      alastria: "",
    },
  },
};

export const TEST = {
  accountNumber: 5,
};

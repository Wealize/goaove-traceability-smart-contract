import * as TUP_Artifact from "artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json";
import * as ProxyAdmin_Artifact from "artifacts/contracts/external/ProxyAdmin.sol/ProxyAdmin.json";
import * as fs from "async-file";
import { Contract, Signer, isAddress, keccak256 } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import yesno from "yesno";
import { CONTRACTS, DEPLOY, GAS_OPT } from "../configuration";
import { INetworkDeployment, IRegularDeployment, IUpgradeDeployment } from "../models/Deploy";
import { ProxyAdmin__factory, TransparentUpgradeableProxy__factory } from "../typechain-types";
import { gNetwork, getNetwork, ghre } from "./utils";

const PROXY_ADMIN_NAME = "ProxyAdmin"
const PROXY_ADMIN_CODEHASH = keccak256(ProxyAdmin_Artifact.deployedBytecode);

/**
 * Performs a regular deployment and updates the deployment information in deployments JSON file
 * @param contractName name of the contract to be deployed
 * @param deployer signer used to sign deploy transacciation
 * @param args arguments to use in the constructor
 * @param txValue contract creation transaccion value
 */
export const deploy = async (
  contractName: string,
  deployer: Signer,
  args: unknown[],
  txValue = 0
) => {
  const ethers = ghre.ethers;
  const factory = await ethers.getContractFactory(contractName, deployer);
  const contract = await (await factory.deploy(...args, { ...GAS_OPT.max, value: txValue }))
  const deploymentReceipt = await contract.deploymentTransaction()?.wait(1);
  const timestamp = await getContractTimestampByBlockHash(deploymentReceipt!.blockHash);
  console.log(`
    Regular contract deployed (deploy):
      - Address: ${contract.target}
      - Arguments: ${args}
      - Type deploy: 'deploy'
      - deployTimestamp: ${timestamp}
      - deployTxHash: ${deploymentReceipt!.hash}
    `);
  // store deployment information
  await saveDeployment({
    address: deploymentReceipt?.contractAddress,
    contractName: contractName,
    type: "deploy",
    deployTimestamp: timestamp,
    deployTxHash: deploymentReceipt?.hash,
    byteCodeHash: keccak256(factory.bytecode),
  } as IRegularDeployment);
};

/**
 * Performs an upgradeable deployment and updates the deployment information in deployments JSON file
 * @param contractName name of the contract to be deployed
 * @param deployer signer used to sign deploy transacciation
 * @param args arguments to use in the initializer
 * @param txValue contract creation transaccion value
 */
export const deployUpgradeable = async (
  contractName: string,
  deployer: Signer,
  args: unknown[] = [],
  txValue = 0,
) => {
  const ethers = ghre.ethers;
  //const gas = await ethers.provider.gas.getGasPrice()
  const factory = await ethers.getContractFactory(contractName, deployer,)
  console.log("GAS_OPT.max.gasLimit: " + GAS_OPT.max.gasLimit)
  const proxy = await upgrades.deployProxy(factory, args, { txOverrides: { ...GAS_OPT.max }, kind: "uups" });
  await proxy.waitForDeployment()
  const deploymentReceipt = await proxy.deploymentTransaction()?.wait(1);
  const timestamp = await getContractTimestampByBlockHash(deploymentReceipt.blockHash);
  console.log(`
  Upgradeable contract deployed (deployProxy):
    - Address: ${proxy.target}
    - Arguments: ${args}
    - Type deploy: 'deployProxy'
    - deployTimestamp: ${timestamp}
    - deployTxHash: ${deploymentReceipt.hash}
  `);
  // store deployment information
  await saveDeployment({
    address: proxy.target,
    type: 'deployProxy',
    contractName: contractName,
    deployTimestamp: timestamp,
    deployTxHash: deploymentReceipt?.hash,
    byteCodeHash: keccak256(factory.bytecode),
  } as IRegularDeployment);
};

/**
 * Upgrades the logic Contract of an upgradeable deployment and updates the deployment information in deployments JSON file
 * @param contractName name of the contract to be upgraded (main use: get factory)
 * @param deployer signer used to sign transacciations
 * @param args arguments to use in the initializer
 * @param contractAddress contract address previous for update
 */
export const upgrade = async (
  contractName: string,
  deployer: Signer,
  args: unknown[],
  contractAddress: string,
) => {
  const ethers = ghre.ethers;
  //const gas = await ethers.provider.gas.getGasPrice()
  const factory = await ethers.getContractFactory(contractName, deployer,)

  const proxy = await upgrades.upgradeProxy(contractAddress, factory, args, { ...GAS_OPT.max });
  await proxy.waitForDeployment()
  const deploymentReceipt = proxy.deployTransaction;

  console.log(`
  Upgradeable contract deployed (upgradeProxy):
    - Address: ${proxy.target}
    - Arguments: ${args}
    - Type deploy: 'upgradeProxy'
    - deployTimestamp: ${await getContractTimestampByBlockHash(deploymentReceipt.blockHash)}
    - deployTxHash: ${deploymentReceipt.hash}
  `);

  // store deployment information
  await saveDeployment({
    address: proxy.target,
    type: "upgradeProxy",
    contractName: contractName,
    deployTimestamp: await getContractTimestampByBlockHash(deploymentReceipt!.blockHash),
    deployTxHash: deploymentReceipt?.hash,
    byteCodeHash: keccak256(factory.bytecode),
  } as IRegularDeployment);
};

/**
 * Performs an upgradeable deployment and updates the deployment information in deployments JSON file
 * @param contractName name of the contract to be deployed
 * @param deployer signer used to sign deploy transacciation
 * @param args arguments to use in the initializer
 * @param txValue contract creation transaccion value
 * @param proxyAdminAddress (optional ? PROXY_ADMIN_ADDRESS) custom proxy admin address
 */
export const deployUpgradeableOld = async (
  contractName: string,
  deployer: Signer,
  args: unknown[] = [],
  txValue = 0,
  proxyAdminAddress: string = CONTRACTS.proxyAdmin.address[gNetwork.name],
  initialize = false
) => {
  const ethers = ghre.ethers;
  const proxyAdminFactory = ethers.getContractFactoryFromArtifact(ProxyAdmin_Artifact, deployer) as Promise<ProxyAdmin__factory>;
  const TUPFactory = ethers.getContractFactoryFromArtifact(TUP_Artifact, deployer) as Promise<TransparentUpgradeableProxy__factory>;
  //* Proxy Admin
  // save or update Proxy Admin in deployments
  let adminDeployment: Promise<IRegularDeployment | undefined> | IRegularDeployment | undefined;
  let proxyAdminContract: Contract;
  if (proxyAdminAddress && typeof proxyAdminAddress == "string" && isAddress(proxyAdminAddress)) {
    proxyAdminContract = (await ethers.getContractAtFromArtifact(ProxyAdmin_Artifact, proxyAdminAddress, deployer));
  } else if (proxyAdminAddress && typeof proxyAdminAddress == "string") {
    throw new Error("String provided as Proxy Admin's address is not an address");
  } else if (!proxyAdminAddress) {
    const firstDeployedAdmin = await getProxyAdminDeployment();
    if (firstDeployedAdmin && firstDeployedAdmin.address) {
      // use the first existant proxy admin deployment
      proxyAdminContract = (await ethers.getContractAtFromArtifact(ProxyAdmin_Artifact, firstDeployedAdmin.address, deployer));
      adminDeployment = firstDeployedAdmin
      proxyAdminAddress = await proxyAdminContract.getAddress()
    } else {
      // deploy new Proxy Admin
      const ok = await yesno({ question: "No ProxyAdmin provided. Do you want to deploy a new Proxy Admin?", });
      if (!ok) {
        throw new Error("Deployment aborted");
      }
      proxyAdminContract = await (await proxyAdminFactory).deploy({ ...GAS_OPT.max })
      const deploymentReceipt = await proxyAdminContract.deploymentTransaction()?.wait(1);
      proxyAdminAddress = await proxyAdminContract.getAddress()
      adminDeployment = {
        address: proxyAdminAddress,
        contractName: PROXY_ADMIN_NAME,
        deployTimestamp: await getContractTimestampByBlockHash(deploymentReceipt!.blockHash),
        deployTxHash: deploymentReceipt!.hash,
        byteCodeHash: keccak256((await proxyAdminFactory).bytecode),
      };
    }
  }
  // check if proxy admin is a ProxyAdmin Contract
  try {
    console.log("proxyAdminAddress: " + proxyAdminAddress)
    const proxyAdminCode = await deployer.provider!.getCode(proxyAdminAddress);
    if (keccak256(proxyAdminCode) != PROXY_ADMIN_CODEHASH) {
      throw new Error(`ERROR: ProxyAdmin(${proxyAdminAddress}) is not a ProxyAdmin Contract`);
    }
  } catch (error) {
    throw new Error(`ERROR: ProxyAdmin(${proxyAdminAddress}) is not a ProxyAdmin Contract`);
  }
  adminDeployment = (await adminDeployment) ? adminDeployment : getProxyAdminDeployment(undefined, proxyAdminAddress);

  //* Deploy actual contracts (logic)
  const factory = await ethers.getContractFactory(contractName, deployer);
  const logic = await (await factory.deploy({ ...GAS_OPT.max, value: txValue }))
  if (!logic || !logic.target)
    throw new Error("Logic|Implementation not deployed properly");
  console.log(`Logic contract deployed at: ${logic.target}`);

  // Encode function params for TUP
  const initData: string = initialize
    ? factory.interface.encodeFunctionData("initialize", [...args])
    : factory.interface._encodeParams([], [])
  console.log(`Initialize data to be used: ${initData}`);

  //* TUP - Transparent Upgradeable Proxy
  const tuProxy = await (await (await TUPFactory).deploy(logic.target, proxyAdminAddress, initData, {
    ...GAS_OPT.max,
    value: txValue,
  }));
  if (!tuProxy || !tuProxy.target)
    throw new Error("Proxy|Storage not deployed properly");

  const receiptLogic = await logic.deploymentTransaction()?.wait(1);
  const receiptTup = await tuProxy.deploymentTransaction()?.wait(1);
  const timestampLogic = await getContractTimestampByBlockHash(receiptLogic!.blockHash);
  console.log(`
    Regular contract deployed (deploy-upgrade-old):
      - Proxy Admin: ${proxyAdminAddress}
      - Proxy: ${tuProxy.target}
      - Logic: ${logic.target}
      - Arguments: ${args}
      - Type deploy: 'deploy-upgrade-old'
      - deployTimestamp Logic: ${timestampLogic}
      - deployTxHash Logic: ${receiptLogic!.hash}
      - deployTxHash Tup: ${receiptTup!.hash}
    `);
  // store deployment information
  await saveDeployment(
    {
      admin: proxyAdminAddress,
      proxy: tuProxy.target,
      logic: logic.target,
      contractName: contractName,
      deploy: "deploy-upgrade-old",
      deployTimestamp: timestampLogic,
      proxyTxHash: receiptTup!.hash,
      logicTxHash: receiptLogic!.hash,
      byteCodeHash: keccak256(factory.bytecode),
    } as IUpgradeDeployment,
    (await adminDeployment)
      ? await adminDeployment
      : {
        address: proxyAdminAddress,
        contractName: PROXY_ADMIN_NAME,
        byteCodeHash: keccak256((await proxyAdminFactory).bytecode),
      }
  );
};

/**
 * Upgrades the logic Contract of an upgradeable deployment and updates the deployment information in deployments JSON file
 * @param contractName name of the contract to be upgraded (main use: get factory)
 * @param deployer signer used to sign transacciations
 * @param args arguments to use in the initializer
 * @param proxy (optional) [undefined] address to identifie multiple contracts with the same name and network
 * @param proxyAdminAddress (optional) [ROXY_ADMIN_ADDRESS] custom proxy admin address
 */
export const upgradeOld = async (
  contractName: string,
  deployer: Signer,
  args: unknown[],
  proxy: string,
  proxyAdminAddress?: string
) => {
  const ethers = ghre.ethers;
  let contractDeployment: PromiseOrValue<IUpgradeDeployment> = getContractDeployment(proxy) as Promise<IUpgradeDeployment>;
  let proxyAdminContract: Contract;
  if (proxyAdminAddress && typeof proxyAdminAddress == "string" && isAddress(proxyAdminAddress)) {
    proxyAdminContract = (await ethers.getContractAtFromArtifact(ProxyAdmin_Artifact, proxyAdminAddress, deployer));
  } else if (proxyAdminAddress && typeof proxyAdminAddress == "string") {
    throw new Error("String provided as Proxy Admin's address is not an address");
  } else if (!proxyAdminAddress) {
    // no proxy admin provided
    if (!(await contractDeployment)?.admin)
      throw new Error(`ERROR: No proxy deployment found for proxy address: ${proxy}`);
    proxyAdminContract = (await ethers.getContractAtFromArtifact(ProxyAdmin_Artifact, (await contractDeployment).admin, deployer));
    proxyAdminAddress = await proxyAdminContract.getAddress()
  }
  // check if proxy admin is a ProxyAdmin Contract
  try {
    const proxyAdminCode = await deployer.provider!.getCode(proxyAdminAddress);
    if (keccak256(proxyAdminCode) != PROXY_ADMIN_CODEHASH)
      throw new Error(`ERROR: ProxyAdmin(${proxyAdminAddress}) is not a ProxyAdmin Contract`);
  } catch (error) {
    throw new Error(`ERROR: ProxyAdmin(${proxyAdminAddress}) is not a ProxyAdmin Contract`);
  }

  //* Deploy actual contracts (logic)
  const factory = await ethers.getContractFactory(contractName, deployer);
  const newLogic = await (await factory.deploy({ ...GAS_OPT.max }))
  if (!newLogic || !newLogic.target)
    throw new Error("Logic|Implementation not deployed properly");
  console.log(`New logic contract deployed at: ${newLogic.target}`);

  // Encode function params for TUP
  const initData: string = args.length > 0 ?
    factory.interface.encodeFunctionData("initialize", [...args]) : factory.interface._encodeParams([], []);

  //* TUP - Transparent Upgradeable Proxy
  contractDeployment = await contractDeployment;

  // Previous Logic
  const previousLogic: Promise<string> = proxyAdminContract!.getProxyImplementation(contractDeployment.proxy);
  let receipt: ContractReceipt;
  if (!contractDeployment.proxy) {
    throw new Error("ERROR: contract retrieved is not upgradeable");
  } else if (args.length > 0) {
    console.log(
      `Performing upgrade and call from ${proxyAdminAddress} to proxy ${contractDeployment.proxy} from logic ${contractDeployment.logic} to ${newLogic.target}`
    );
    receipt = await (
      await proxyAdminContract!.upgradeAndCall(
        contractDeployment.proxy,
        newLogic.target,
        initData,
        GAS_OPT.max
      )
    ).wait();
  } else {
    console.log(
      `Performing upgrade from ${proxyAdminAddress} to proxy ${contractDeployment.proxy} from logic ${contractDeployment.logic} to ${newLogic.target}`
    );
    receipt = await (
      await proxyAdminContract!.upgrade(contractDeployment.proxy, newLogic.target, GAS_OPT.max)
    ).wait();
  }
  if (!receipt) {
    throw new Error("Transaction execution failed. Undefined Receipt");
  }
  const newLogicFromAdmin: Promise<string> = proxyAdminContract!.getProxyImplementation(contractDeployment.proxy);
  if ((await newLogicFromAdmin) == (await previousLogic)) {
    throw new Error("Upgrade failed. Previous address and new one are the same");
  }
  if ((await newLogicFromAdmin) != newLogic.target) {
    throw new Error("Upgrade failed. Logic addresess does not match");
  }

  const receiptLogic = await newLogic.deploymentTransaction()?.wait(1);
  const timestampLogic = await getContractTimestampByBlockHash(receiptLogic!.blockHash);
  console.log(`
     Contract upgraded (upgrade-old):
       - Proxy Admin: ${proxyAdminAddress}
       - Proxy: ${contractDeployment.proxy}
       - Previous Logic: ${await previousLogic}
       - New Logic: ${newLogic.target}
       - Arguments: ${args}
       - Type deploy: 'upgrade-old'
       - deployTimestamp Logic: ${timestampLogic}
       - deployTxHash Logic: ${receiptLogic!.hash}
     `);
  // store deployment information
  contractDeployment.admin = proxyAdminAddress;
  contractDeployment.logic = newLogic.target;
  contractDeployment.contractName = contractName;
  contractDeployment.deploy = "upgrade-old";
  contractDeployment.upgradeTimestamp = timestampLogic;
  contractDeployment.logicTxHash = receiptLogic!.hash;
  contractDeployment.byteCodeHash = keccak256(factory.bytecode);
  await saveDeployment(contractDeployment);
};


export const getLogic = async (proxy: string, proxyAdmin?: string, hre: HardhatRuntimeEnvironment = ghre) => {
  proxyAdmin = proxyAdmin || (await getProxyAdminDeployment(proxy))?.address;
  if (!proxyAdmin)
    throw new Error(`ERROR: ${proxy} NOT found in this network`);

  // instanciate the ProxyAdmin
  const proxyAdminContract = new Contract(proxyAdmin, ProxyAdmin_Artifact.abi, hre.ethers.provider) as ProxyAdmin;

  // check if proxy admin is a ProxyAdmin Contract
  try {
    const proxyAdminCode = await hre.ethers.provider!.getCode(proxyAdmin);
    if (keccak256(proxyAdminCode) != PROXY_ADMIN_CODEHASH) {
      throw new Error(`ERROR: ProxyAdmin(${proxyAdmin}) is not a ProxyAdmin Contract`);
    }
  } catch (error) {
    throw new Error(`ERROR: ProxyAdmin(${proxyAdmin}) is not a ProxyAdmin Contract`);
  }

  const callResults = await Promise.all([
    // get actual logic address directly from the proxy's storage
    hre.ethers.provider.getStorage(
      proxy,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    ),
    // get actual admin address directly from the proxy's storage'
    hre.ethers.provider.getStorage(
      proxy,
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    ),
    // get actual logic address from ProxyAdmin
    proxyAdminContract.getProxyImplementation(proxy),
    // get actual admin address from ProxyAdmin
    proxyAdminContract.getProxyAdmin(proxy),
  ]);

  // return as an object
  return {
    logicFromProxy: callResults[0],
    adminFromProxy: callResults[1],
    logicFromAdmin: callResults[2],
    adminFromAdmin: callResults[3],
  };
};

export const changeLogic = async (proxy: string, newLogic: string, signer: Signer, proxyAdmin?: string) => {
  proxyAdmin = proxyAdmin || (await getProxyAdminDeployment(proxy))?.address;
  if (!proxyAdmin)
    throw new Error(`ERROR: ${proxy} NOT found in this network`);

  // instanciate the ProxyAdmin
  const proxyAdminContract = new Contract(proxyAdmin, ProxyAdmin_Artifact.abi, signer) as ProxyAdmin;
  try {
    const proxyAdminCode = await signer.provider!.getCode(proxyAdmin);
    if (keccak256(proxyAdminCode) != PROXY_ADMIN_CODEHASH)
      throw new Error(`ERROR: ProxyAdmin(${proxyAdmin}) is not a ProxyAdmin Contract`);
  } catch (error) {
    throw new Error(`ERROR: ProxyAdmin(${proxyAdmin}) is not a ProxyAdmin Contract`);
  }
  // Get logic|implementation address
  const previousLogic = await proxyAdminContract.getProxyImplementation(proxy);
  // Change logic contract
  const response = await proxyAdminContract.upgrade(proxy, newLogic, GAS_OPT.max)
  const receipt = await (response).wait();
  console.log("aaa: ", receipt)

  // Get logic|implementation address
  const actualLogic = await proxyAdminContract.getProxyImplementation(proxy);
  return { previousLogic, actualLogic, receipt };
};

/**
 * Saves a deployments JSON file with the updated deployments information
 * @param deployment deployment object to added to deplyments file
 */
export const saveDeployment = async (
  deployment: IRegularDeployment | IUpgradeDeployment,
  proxyAdmin?: IRegularDeployment
) => {
  let { networkIndex, netDeployment, deployments } = await getActualNetDeployment();
  // if no deployed yet in this network
  if (networkIndex == undefined) {
    const network = await getNetwork()
    netDeployment = {
      network: {
        name: network!.name,
        chainId: network!.chainId,
      },
      smartContracts: {
        proxyAdmins: proxyAdmin ? [proxyAdmin] : [],
        contracts: [deployment],
      },
    };
    // add to network deployments array
    deployments.push(netDeployment);
  } else if (netDeployment) {
    // if deployed before in this network
    //* proxy admin
    if (proxyAdmin && netDeployment.smartContracts.proxyAdmins) {
      // if new proxyAdmin and some proxy admin already registered
      const oldIndex = netDeployment.smartContracts.proxyAdmins.findIndex(item => item.address == proxyAdmin.address);
      if (oldIndex != -1) {
        // found, update proxyAdmin
        netDeployment.smartContracts.proxyAdmins[oldIndex] = proxyAdmin;
      } else {
        // not found, push new proxyAdmin
        netDeployment.smartContracts.proxyAdmins.push(proxyAdmin);
      }
    } else if (proxyAdmin) {
      // network deployment but no Proxy admins
      netDeployment.smartContracts.proxyAdmins = [proxyAdmin];
    }
    //* smart contract
    const upgradeThis = netDeployment.smartContracts.contracts.findIndex(
      item => (item as IUpgradeDeployment).proxy && (item as IUpgradeDeployment).proxy == (deployment as IUpgradeDeployment).proxy);
    if (upgradeThis != -1) {
      // found, update upgradeable deployment
      netDeployment.smartContracts.contracts[upgradeThis] = deployment;
    } else {
      // not found or not upgradeable
      netDeployment.smartContracts.contracts.push(deployment);
    }
    // replace (update) network deployment
    deployments[networkIndex] = netDeployment;
  }

  // store/write deployments JSON file
  await fs.writeFile(DEPLOY.deploymentsPath, JSON.stringify(deployments));
};


/**
 * Gets a Proxy Admin Deployment from a Network Deployment from deployments JSON file
 * @param adminAddress address that identifies a Proxy Admin in a network deployment
 * @returns Proxy Admin Deployment object
 */
const getProxyAdminDeployment = async (proxy?: string, adminAddress?: string) => {

  const { networkIndex, netDeployment, deployments } = await getActualNetDeployment();
  if (networkIndex == undefined || !netDeployment) {
    console.log("WARN: there is no deployment for this network");
    return;
  } else if (netDeployment.smartContracts.proxyAdmins) {
    if (proxy && isAddress(proxy)) {
      // if the proxy address is given, get the proxy deployment to get the associated proxyAdmin
      const proxyDep = netDeployment.smartContracts.contracts.find(item => (item as IUpgradeDeployment).proxy === proxy);
      if (!proxyDep) {
        throw new Error(`ERROR: there is no deployment that match ${proxy} proxy for this network`);
      }
      return netDeployment.smartContracts.proxyAdmins?.find(item => item.address === (proxyDep as IUpgradeDeployment).admin);
    } else if (adminAddress && isAddress(adminAddress)) {
      // if the proxyAdmin address is given, get this proxyAdmin
      return netDeployment.smartContracts.proxyAdmins?.find(item => item.address === adminAddress);
    } else if (proxy || adminAddress) {
      throw new Error("String provided as an address is not an address");
    } else { // no address, get first Proxy Admin
      return netDeployment.smartContracts.proxyAdmins[0];
    }
  } else {
    console.log("WARN: there is no Proxy Admin deployed in this network");
    return;
  }
};

/**
 * Gets a Contract Deployment from a Network Deployment from deployments JSON file
 * @param addressOrName address or name that identifies a contract in a network deployment
 * @returns Contract Deployment object
 */
const getContractDeployment = async (addressOrName: string) => {

  const { networkIndex, netDeployment, deployments } = await getActualNetDeployment();
  if (networkIndex == undefined || !netDeployment) {
    throw new Error("ERROR: there is no deployment for this network");
  } else if (!netDeployment.smartContracts.contracts) {
    throw new Error("ERROR: there is no contracts deployed in this network");
  } else if (isAddress(addressOrName)) {
    return netDeployment.smartContracts.contracts.find(item =>
      (item as IRegularDeployment).address == addressOrName || (item as IUpgradeDeployment).proxy == addressOrName);
  } else {
    // if contract came provided get last deployment with this name
    const contractsFound = netDeployment.smartContracts.contracts.filter(
      (contract) => contract.contractName == addressOrName
    );
    return contractsFound.pop();
  }
};

/**
 * Gets the actual Network Deployment from deployments JSON file
 * @param hre (optional | ghre) use custom HRE
 * @returns Network Deployment object
 */
const getActualNetDeployment = async (hre?: HardhatRuntimeEnvironment) => {

  const network = await getNetwork(hre)
  let deployments: INetworkDeployment[] = [];
  // if the file exists, get previous data
  if (await fs.exists(DEPLOY.deploymentsPath)) {
    deployments = JSON.parse(await fs.readFile(DEPLOY.deploymentsPath));
  } else {
    console.warn("WARN: no deplyments file, createing a new one...");
  }
  // check if network is available in the deployments file
  const networkIndex = deployments.findIndex(item => item.network.name == network.name && item.network.chainId == network.chainId);
  let netDeployment: INetworkDeployment | undefined;
  if (networkIndex !== -1) {
    netDeployment = deployments[networkIndex];
    return {
      networkIndex: networkIndex,
      netDeployment: netDeployment,
      deployments: deployments,
    };
  }
  return {
    deployments: deployments,
  };
};

/**
 * Gets the deployed contract timestamp
 * @param contract contract instance to use
 * @param deployTxHash (optional | undefined) it can be used to retrive timestamp
 * @param hre (optional | ghre) use custom HRE
 * @returns ISO string date time representation of the contract timestamp
 */
const getContractTimestampByBlockHash = async (blockHash: string, hre?: HardhatRuntimeEnvironment) => {
  const provider = hre ? hre.ethers.provider : ghre.ethers.provider;
  const timestampSeconds = (await provider.getBlock(blockHash)).timestamp;
  return new Date(timestampSeconds * 1000).toISOString();
};

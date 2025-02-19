
// import { ethers } from "hardhat"; //! Cannot be imported here or any file that is imported here because it is generated here

import { Mnemonic } from "ethers/lib/utils";
import { KEYSTORE } from "./configuration";
import { decryptWallet, generateWallet } from "./scripts/wallets";

export const getWaleletFromArgs = async (args: any, connect?: boolean) => {
    args.mnemonicPhrase = args.mnemonicPhrase == "default" ? KEYSTORE.default.mnemonic.phrase : args.mnemonicPhrase;
    if (args.mnemonicPhrase) {
        return await generateWallet(undefined, undefined, undefined, undefined, {
            phrase: args.mnemonicPhrase,
            path: args.mnemonicPath,
            locale: args.mnemonicLocale,
        } as Mnemonic,
            connect);
    } else if (args.relativePath) {
        return await decryptWallet(args.relativePath, args.password, true);
    } else {
        throw new Error("Cannot get a wallet from parameters, needed path or Mnemonic");
    }
}

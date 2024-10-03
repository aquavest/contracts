import { task, type HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

import { ETHERSCAN_API, RPC_URL, USER_PRIVATE_KEY } from "./helpers/constants";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      evmVersion: "shanghai",
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    // sepolia: {
    //   url: RPC_URL,
    //   accounts: [USER_PRIVATE_KEY],
    // }
    neoXT4: {
      url: RPC_URL,
      chainId: 12227332,
      accounts: [USER_PRIVATE_KEY],
    },
  },
  // etherscan: {
  //   // Your API key for Etherscan
  //   // Obtain one at https://etherscan.io/
  //   apiKey: ETHERSCAN_API,
  // },
  // sourcify: {
  //   // Disabled by default
  //   // Doesn't need an API key
  //   enabled: true,
  // },
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.viem.getWalletClients();
  for (const account of accounts) {
    console.log(account.account.address);
  }
});

export default config;

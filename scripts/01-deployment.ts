import { Address } from "viem";

import {
  abi,
  bytecode,
} from "../artifacts/contracts/02-investment-pools.sol/InvestmentPools.json";

import { userConnectWallet } from "../helpers/userConnectWallet";
import { connectToBlockchainWithRPC } from "../helpers/connectToBlockchainWithRPC";
import { USDC_CONTRACT_ADDRESS } from "../helpers/constants";

const TOKEN_NAME = "Aquavest Token";
const TOKEN_SYMBOL = "FISH";
const EXCHANGE_RATE = BigInt(10 ** 12); // Set exchange rate to 10^12 (1 USDC = 1 FISH, accounting for decimal difference)

async function getUserAccount() {
  return await userConnectWallet();
}

async function getClient() {
  return await connectToBlockchainWithRPC();
}

async function main() {
  let contractAddress: Address;
  let tokenAddress: Address;
  const publicClient = await getClient();
  const deployer = await getUserAccount();
  const hash = await deployer.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    args: [TOKEN_NAME, TOKEN_SYMBOL, USDC_CONTRACT_ADDRESS, EXCHANGE_RATE],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.contractAddress) {
    contractAddress = receipt.contractAddress;
    tokenAddress = (await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: "fishToken",
      args: [],
    })) as Address;

    console.log(`Contract deployed at: ${contractAddress}`);
    console.log(`Token deployed at: ${tokenAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

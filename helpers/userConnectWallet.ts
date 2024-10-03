import { createWalletClient, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { chainToUse, TRANSPORT, USER_PRIVATE_KEY } from "./constants";

export const userConnectWallet = async () => {
  const account = privateKeyToAccount(`0x${USER_PRIVATE_KEY}` as Address);
  const user = createWalletClient({
    account,
    chain: chainToUse,
    transport: TRANSPORT,
  });

  return user;
};

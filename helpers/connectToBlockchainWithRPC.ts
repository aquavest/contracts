import { createPublicClient } from "viem";

import { chainToUse, TRANSPORT } from "./constants";

export const connectToBlockchainWithRPC = async () => {
  const publicClient = createPublicClient({
    chain: chainToUse,
    transport: TRANSPORT,
  });

  return publicClient;
};

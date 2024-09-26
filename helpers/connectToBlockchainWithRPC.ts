import { createPublicClient } from "viem";
import { sepolia } from "viem/chains";

import { TRANSPORT } from "./constants";

export const connectToBlockchainWithRPC = async () => {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: TRANSPORT,
  });

  return publicClient;
};

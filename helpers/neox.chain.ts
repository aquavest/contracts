import { defineChain } from "viem";

export const neoXT4 = defineChain({
  id: 12_227_332,
  name: "NeoX T4",
  nativeCurrency: {
    decimals: 18,
    name: "NeoX T4",
    symbol: "GAS",
  },
  rpcUrls: {
    default: { http: ["https://neoxt4seed1.ngd.network"] },
  },
  blockExplorers: {
    default: {
      name: "NeoX T4 Scan",
      url: "https://neoxt4scan.ngd.network/",
    },
  },
  contracts: {
    multicall3: {
      address: "0x82096F92248dF7afDdef72E545F06e5be0cf0F99",
    },
  },
});

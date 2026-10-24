import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"] }
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://testnet.monadscan.com" }
  },
  testnet: true
});

export const MONAD_EXPLORER = "https://testnet.monadscan.com";
export const MONAD_FAUCET = "https://faucet.monad.xyz";

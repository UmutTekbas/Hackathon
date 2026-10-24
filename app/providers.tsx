"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { monadTestnet } from "@/lib/chain";

const config = getDefaultConfig({
  appName: "ProofStream",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "proofstream-local-demo",
  chains: [monadTestnet],
  ssr: true
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: "#c8ff62",
          accentColorForeground: "#08090c",
          borderRadius: "medium"
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

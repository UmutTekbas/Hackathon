import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofStream — Learn. Stream. Prove.",
  description: "Real-time tutoring payments with portable on-chain skill proofs on Monad."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><Providers><Header />{children}</Providers></body>
    </html>
  );
}

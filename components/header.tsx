"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[.06] bg-void/80 backdrop-blur-xl">
      <div className="shell flex h-[74px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="ProofStream home">
          <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-signal text-void">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h10M4 12h16M10 16h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-void bg-violet" />
          </span>
          <span className="text-lg font-black tracking-[-.045em]">ProofStream</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/create" className="hidden text-sm font-semibold text-mist hover:text-white sm:block">Create session</Link>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
        </nav>
      </div>
    </header>
  );
}

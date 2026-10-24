"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { decodeEventLog, parseEther, type Hash } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ArrowUpRight } from "@/components/icons";
import { isContractConfigured, proofStreamAbi, proofStreamAddress } from "@/lib/contract";

function friendlyError(error: Error | null) {
  if (!error) return null;
  if (error.message.includes("User rejected")) return "Transaction rejected in wallet.";
  const message = error.message.split("\n")[0];
  return message.length > 160 ? `${message.slice(0, 160)}…` : message;
}

export default function CreateSessionPage() {
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [rate, setRate] = useState("0.5");
  const [hash, setHash] = useState<Hash>();
  const [sessionId, setSessionId] = useState<bigint>();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!receipt.data) return;
    for (const log of receipt.data.logs) {
      try {
        const decoded = decodeEventLog({ abi: proofStreamAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "SessionCreated") {
          setSessionId(decoded.args.sessionId);
          return;
        }
      } catch { /* Ignore logs from other contracts. */ }
    }
  }, [receipt.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !subject.trim() || Number(rate) <= 0) return;
    const txHash = await writeContractAsync({
      address: proofStreamAddress,
      abi: proofStreamAbi,
      functionName: "createSession",
      args: [`${title.trim()} · ${subject.trim()}`, parseEther(rate)]
    });
    setHash(txHash);
  }

  if (sessionId !== undefined) {
    const path = `/session/${sessionId}`;
    return (
      <main className="shell grid min-h-[calc(100vh-74px)] place-items-center py-16">
        <section className="panel w-full max-w-2xl rounded-2xl p-7 sm:p-10">
          <p className="eyebrow">Confirmed on Monad</p>
          <h1 className="mt-5 text-4xl font-black tracking-[-.05em]">Your skill stream is open.</h1>
          <p className="mt-4 leading-7 text-mist">Share this link with your student. Their MON will be held by the contract, and the completed session can become a portable proof.</p>
          <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-line bg-void p-4"><code className="truncate text-sm text-signal">{typeof window !== "undefined" ? `${window.location.origin}${path}` : path}</code><button type="button" className="button-secondary !min-h-10 shrink-0 !px-3 text-sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${path}`)}>Copy</button></div>
          <Link href={path} className="button-primary mt-6 w-full">Open session <ArrowUpRight/></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell grid gap-12 py-16 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
      <section>
        <p className="eyebrow">Tutor setup</p>
        <h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">Create a session worth proving.</h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-mist">Set the skill and rate, sign once, and share the link. Payment and reputation will live in the same on-chain story.</p>
        <div className="mt-10 border-l border-signal pl-5 text-sm leading-6 text-mist"><strong className="block text-white">Your wallet is the payout account.</strong>ProofStream never takes custody outside the deployed smart contract.</div>
      </section>

      <section className="panel rounded-2xl p-6 sm:p-9">
        {!isContractConfigured && <div className="mb-6 rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-[#ffb6ae]">Deploy first, then set <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code> to enable transactions.</div>}
        {!isConnected ? (
          <div className="grid min-h-[410px] place-items-center text-center"><div><p className="text-2xl font-bold">Connect your tutor wallet</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-mist">This address receives earned MON and accumulates on-chain reputation.</p><div className="mt-6 flex justify-center"><ConnectButton/></div></div></div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid gap-6">
              <label><span className="mb-2 block text-sm font-semibold">Session title</span><input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Calculus masterclass" maxLength={80} required/></label>
              <label><span className="mb-2 block text-sm font-semibold">Skill / subject</span><input className="field" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Derivatives & integrals" maxLength={80} required/></label>
              <label><span className="mb-2 block text-sm font-semibold">Price per minute</span><div className="relative"><input className="field pr-20 font-mono" type="number" value={rate} onChange={(event) => setRate(event.target.value)} min="0.000001" step="0.000001" required/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-signal">MON</span></div></label>
            </div>
            <div className="mt-7 rounded-xl border border-line bg-void p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-wider text-mist">On-chain offer preview</p><span className="font-mono text-xs text-violet">REP +1 after proof</span></div><div className="mt-4 flex items-end justify-between gap-4"><p className="font-semibold">{title || "Your session"}{subject ? ` · ${subject}` : ""}</p><p className="shrink-0 font-mono text-signal">{rate || "0"} / min</p></div></div>
            <button className="button-primary mt-7 w-full" disabled={!isContractConfigured || isPending || receipt.isLoading}>{isPending ? "Confirm in wallet…" : receipt.isLoading ? "Confirming on Monad…" : "Create on-chain session"}</button>
            {friendlyError(error) && <p className="mt-4 text-sm text-coral">{friendlyError(error)}</p>}
          </form>
        )}
      </section>
    </main>
  );
}

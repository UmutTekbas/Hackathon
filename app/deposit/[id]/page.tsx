"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatEther, parseEther, zeroAddress, type Hash } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { depositPlans, findCourseBySessionTitle } from "@/lib/courses";
import { isContractConfigured, proofStreamAbi, proofStreamAddress, type ProofSession } from "@/lib/contract";
import { monadTestnet } from "@/lib/chain";

export default function DepositPage() {
  const params = useParams<{ id: string }>();
  const sessionId = useMemo(() => { try { return BigInt(params.id); } catch { return 0n; } }, [params.id]);
  const { address, isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState("2");
  const [hash, setHash] = useState<Hash>();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: monadTestnet.id, confirmations: 1, timeout: 45_000 });
  const { data, isLoading } = useReadContract({
    address: proofStreamAddress,
    abi: proofStreamAbi,
    functionName: "getSession",
    args: [sessionId],
    chainId: monadTestnet.id,
    query: { enabled: isContractConfigured }
  });
  const session = data as ProofSession | undefined;
  const course = findCourseBySessionTitle(session?.title);
  const plan = depositPlans.find((item) => item.amount === selectedAmount) ?? depositPlans[0];
  const gross = Number(plan.amount);
  const fee = gross * plan.feeBps / 10_000;
  const net = gross - fee;
  const isStudent = Boolean(address && session && session.student !== zeroAddress && address.toLowerCase() === session.student.toLowerCase());
  const canDeposit = Boolean(session && session.status < 3 && (session.student === zeroAddress || isStudent));
  const returnPath = `/session/${sessionId}${course ? `?course=${course.slug}` : ""}`;

  async function deposit() {
    const txHash = await writeContractAsync({
      address: proofStreamAddress,
      abi: proofStreamAbi,
      functionName: "deposit",
      args: [sessionId],
      value: parseEther(plan.amount),
      chainId: monadTestnet.id
    });
    setHash(txHash);
  }

  if (!isContractConfigured) return <main className="shell py-20 text-mist">Deploy the contract and set <code className="text-signal">NEXT_PUBLIC_CONTRACT_ADDRESS</code> first.</main>;
  if (isLoading || !session) return <main className="shell py-20 text-mist">Reading session from Monad…</main>;

  return (
    <main className="shell grid gap-10 py-14 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
      <section>
        <p className="eyebrow">On-chain balance</p>
        <h1 className="mt-5 text-5xl font-black tracking-[-.055em]">Fund your learning stream.</h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-mist">Choose a plan. The platform commission is paid on-chain and the remaining amount goes directly into this session's escrow.</p>
        <div className="mt-8 rounded-xl border border-line bg-panel/70 p-5"><p className="text-xs uppercase tracking-wider text-mist">Current escrow</p><p className="mt-2 font-mono text-2xl font-bold text-signal">{Number(formatEther(session.depositedAmount)).toLocaleString()} MON</p><p className="mt-2 text-sm text-mist">{session.title}</p></div>
      </section>

      <section className="panel rounded-2xl p-6 sm:p-9">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Deposit plans</p><h2 className="mt-3 text-2xl font-black">More learning, lower fee.</h2></div><span className="font-mono text-xs text-mist">MIN 2 MON</span></div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          {depositPlans.map((item) => <button key={item.amount} type="button" onClick={() => setSelectedAmount(item.amount)} className={`rounded-xl border p-4 text-left transition-colors ${selectedAmount === item.amount ? "border-signal bg-signal/[.08]" : "border-line bg-void hover:border-mist"}`}><span className="text-xs text-mist">{item.label}</span><strong className="mt-2 block font-mono text-xl">{item.amount} MON</strong><span className="mt-2 block font-mono text-xs text-signal">{item.feeBps / 100}% fee</span></button>)}
        </div>
        <div className="mt-6 space-y-3 rounded-xl border border-line bg-void p-5 text-sm"><div className="flex justify-between"><span className="text-mist">You pay</span><strong className="font-mono">{gross.toFixed(2)} MON</strong></div><div className="flex justify-between"><span className="text-mist">On-chain platform fee</span><strong className="font-mono">{fee.toFixed(2)} MON</strong></div><div className="flex justify-between border-t border-line pt-3"><span className="text-mist">Added to stream</span><strong className="font-mono text-signal">{net.toFixed(2)} MON</strong></div></div>

        {!isConnected ? <div className="mt-6"><ConnectButton/></div> : receipt.isSuccess ? <div className="mt-6"><div className="rounded-xl border border-signal/35 bg-signal/[.07] p-4 text-sm text-signal">Deposit confirmed on Monad. Your stream balance is ready.</div><Link href={returnPath} className="button-primary mt-4 w-full">Return to lesson</Link></div> : <button type="button" className="button-primary mt-6 w-full" disabled={!canDeposit || isPending || receipt.isLoading} onClick={deposit}>{isPending ? "Confirm in wallet…" : receipt.isLoading ? "Confirming on Monad…" : `Deposit ${plan.amount} MON`}</button>}
        {!canDeposit && <p className="mt-4 text-sm leading-6 text-coral">Only this session's student can top up an active stream. Ended sessions cannot receive deposits.</p>}
        {error && <p className="mt-4 text-sm text-coral">{error.message.split("\n")[0]}</p>}
      </section>
    </main>
  );
}

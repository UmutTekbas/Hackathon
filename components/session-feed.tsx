"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { proofStreamAbi, proofStreamAddress, isContractConfigured, statusLabel, type ProofSession } from "@/lib/contract";
import { getCourse } from "@/lib/courses";
import { ArrowUpRight, Seal } from "./icons";

function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

function Reputation({ tutor }: { tutor: `0x${string}` }) {
  const { data } = useReadContract({
    address: proofStreamAddress, abi: proofStreamAbi, functionName: "tutorReputation", args: [tutor],
    query: { enabled: isContractConfigured, refetchInterval: 4_000 }
  });
  return <span className="inline-flex items-center gap-1.5 text-xs text-violet"><Seal /> {Number(data ?? 0n)} proofs</span>;
}

function SessionRow({ id, courseSlug }: { id: bigint; courseSlug?: string }) {
  const { data } = useReadContract({
    address: proofStreamAddress, abi: proofStreamAbi, functionName: "getSession", args: [id],
    query: { enabled: isContractConfigured, refetchInterval: 3_000 }
  });
  const session = data as ProofSession | undefined;
  if (!session || session.status === 3 || session.proofIssued) return null;
  const selectedCourse = getCourse(courseSlug);
  if (selectedCourse && !session.title.toLowerCase().includes(selectedCourse.title.toLowerCase())) return null;

  return (
    <Link href={`/session/${id}${courseSlug ? `?course=${courseSlug}` : ""}`} className="group grid gap-5 border-t border-line py-6 transition-colors hover:border-signal/60 md:grid-cols-[1fr_165px_140px_32px] md:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2"><span className="status-dot"/><span className="font-mono text-[11px] uppercase tracking-[.14em] text-signal">{statusLabel[session.status]}</span></div>
        <h3 className="text-lg font-bold tracking-tight">{session.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-mist"><span>{shortAddress(session.tutor)}</span><Reputation tutor={session.tutor}/></div>
      </div>
      <div><p className="text-xs uppercase tracking-wider text-mist">Rate</p><p className="mt-1 font-mono font-semibold">{Number(formatEther(session.pricePerMinute / 60n)).toLocaleString()} MON/sec</p></div>
      <div><p className="text-xs uppercase tracking-wider text-mist">Escrow</p><p className="mt-1 font-mono font-semibold">{Number(formatEther(session.depositedAmount)).toLocaleString()} MON</p></div>
      <ArrowUpRight className="text-mist transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-signal"/>
    </Link>
  );
}

export function SessionFeed({ courseSlug }: { courseSlug?: string } = {}) {
  const { data: nextId, isLoading } = useReadContract({
    address: proofStreamAddress, abi: proofStreamAbi, functionName: "nextSessionId",
    query: { enabled: isContractConfigured, refetchInterval: 3_000 }
  });

  if (!isContractConfigured) return <div className="border-t border-line py-8 text-mist"><p className="font-semibold text-white">Contract deployment required</p><p className="mt-2 text-sm">Set <code className="text-signal">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to load live on-chain sessions.</p></div>;
  if (isLoading) return <div className="border-t border-line py-8 text-mist">Reading Monad Testnet…</div>;
  const count = Number(nextId ?? 0n);
  if (!count) return <div className="border-t border-line py-9"><p className="text-lg font-semibold">No sessions yet.</p><p className="mt-2 text-sm text-mist">Create the first paid skill stream.</p></div>;
  const first = Math.max(0, count - 8);
  const ids = Array.from({ length: count - first }, (_, index) => BigInt(count - index - 1));
  return <div>{ids.map((id) => <SessionRow key={id.toString()} id={id} courseSlug={courseSlug}/>)}</div>;
}

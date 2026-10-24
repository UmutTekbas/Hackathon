"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatEther, zeroAddress, type Hash } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Seal } from "@/components/icons";
import { monadTestnet, MONAD_EXPLORER } from "@/lib/chain";
import { isContractConfigured, proofStreamAbi, proofStreamAddress, statusLabel, type ProofSession } from "@/lib/contract";
import { findCourseBySessionTitle, youtubeEmbedUrl } from "@/lib/courses";

const ATTESTATION_TIMEOUT = 300;

function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function formatClock(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
function formatMon(value: bigint, digits = 5) { return Number(formatEther(value)).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function errorSummary(error: Error | null) {
  if (!error) return null;
  if (error.message.includes("User rejected")) return "Transaction rejected in wallet.";
  const firstLine = error.message.split("\n")[0];
  return firstLine.length > 180 ? `${firstLine.slice(0, 180)}…` : firstLine;
}

type Action = "start" | "end" | "attest";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = useMemo(() => { try { return BigInt(params.id); } catch { return 0n; } }, [params.id]);
  const { address, isConnected } = useAccount();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [hash, setHash] = useState<Hash>();
  const [action, setAction] = useState<Action>();
  const [settlementRequestedAt, setSettlementRequestedAt] = useState<number>();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: monadTestnet.id,
    confirmations: 1,
    timeout: 45_000,
    query: { enabled: Boolean(hash), retry: false }
  });
  const { data, isLoading, isError, refetch } = useReadContract({
    address: proofStreamAddress, abi: proofStreamAbi, functionName: "getSession", args: [sessionId], chainId: monadTestnet.id,
    query: { enabled: isContractConfigured, refetchInterval: 2_000 }
  });
  const session = data as ProofSession | undefined;
  const { data: reputation, refetch: refetchReputation } = useReadContract({
    address: proofStreamAddress, abi: proofStreamAbi, functionName: "tutorReputation",
    args: [session?.tutor ?? zeroAddress], chainId: monadTestnet.id,
    query: { enabled: Boolean(isContractConfigured && session), refetchInterval: 3_000 }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (receipt.isSuccess) {
      void Promise.all([refetch(), refetchReputation()]);
    }
  }, [receipt.isSuccess, refetch, refetchReputation]);

  const status = session?.status ?? 0;
  const isActive = status === 2;
  const accrualNow = isActive && settlementRequestedAt ? settlementRequestedAt : now;
  const accrued = session
    ? status === 3
      ? session.earnedAmount
      : isActive
        ? [session.accruedAmount + BigInt(Math.max(0, accrualNow - Number(session.accrualStartedAt))) * session.pricePerMinute / 60n, session.depositedAmount].reduce((a, b) => a < b ? a : b)
        : 0n
    : 0n;
  const elapsed = session && session.pricePerMinute > 0n ? Number((accrued * 60n) / session.pricePerMinute) : 0;
  const remaining = session ? (status === 3 ? session.refundedAmount : session.depositedAmount - accrued) : 0n;
  const progress = session && session.depositedAmount > 0n ? Math.min(100, Number((accrued * 10_000n) / session.depositedAmount) / 100) : 0;
  const isStudent = Boolean(address && session && address.toLowerCase() === session.student.toLowerCase());
  const isTutor = Boolean(address && session && address.toLowerCase() === session.tutor.toLowerCase());
  const hasAttested = Boolean(session && ((isStudent && session.studentAttested) || (isTutor && session.tutorAttested)));
  const timeoutRemaining = session?.endedAt ? Math.max(0, Number(session.endedAt) + ATTESTATION_TIMEOUT - now) : ATTESTATION_TIMEOUT;
  const txBusy = isPending || receipt.isLoading;
  const course = findCourseBySessionTitle(session?.title);
  const isOutOfFunds = Boolean(isActive && session && remaining === 0n);
  const videoIsUnlocked = Boolean(course && isActive && !isOutOfFunds);
  const pricePerSecond = session ? session.pricePerMinute / 60n : 0n;
  const displayedElapsed = elapsed;

  useEffect(() => {
    if (status !== 2 || receipt.isError) setSettlementRequestedAt(undefined);
  }, [status, receipt.isError]);

  async function transact(nextAction: Action) {
    setHash(undefined);
    setAction(nextAction);
    try {
      const txHash = await writeContractAsync({ address: proofStreamAddress, abi: proofStreamAbi, functionName: nextAction === "start" ? "startSession" : nextAction === "end" ? "endSession" : "attestSession", args: [sessionId], chainId: monadTestnet.id });
      if (nextAction === "end") setSettlementRequestedAt(Math.floor(Date.now() / 1000));
      setHash(txHash);
    } catch {
      setSettlementRequestedAt(undefined);
      /* Error is exposed by useWriteContract. */
    }
  }

  if (!isContractConfigured) return <main className="shell grid min-h-[calc(100vh-74px)] place-items-center py-16"><div className="panel max-w-xl rounded-2xl p-8 text-center"><p className="eyebrow">Setup incomplete</p><h1 className="mt-4 text-3xl font-black">Deploy the contract first.</h1><p className="mt-4 text-mist">Set <code className="text-signal">NEXT_PUBLIC_CONTRACT_ADDRESS</code> and restart the app.</p></div></main>;
  if (isLoading) return <main className="shell py-24 text-mist">Reading session #{params.id} from Monad…</main>;
  if (isError || !session) return <main className="shell py-24"><h1 className="text-3xl font-bold">Session not found.</h1></main>;

  const displayStatus = session.proofIssued ? "Skill proof recorded" : statusLabel[status];

  return (
    <main className="shell py-10 lg:py-16">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2"><span className={`status-dot ${session.proofIssued ? "!bg-violet !shadow-[0_0_16px_rgba(165,139,255,.7)]" : ""}`}/><p className="eyebrow">Session #{sessionId.toString()} · {displayStatus}</p></div><h1 className="mt-4 text-3xl font-black tracking-[-.045em] sm:text-5xl">{session.title}</h1></div>
        <div className="flex flex-wrap gap-4 text-sm text-mist"><span>Tutor <a className="font-mono text-white hover:text-signal" href={`${MONAD_EXPLORER}/address/${session.tutor}`} target="_blank" rel="noreferrer">{shortAddress(session.tutor)} ↗</a></span><span className="text-violet">✦ {Number(reputation ?? 0n)} reputation</span></div>
      </div>

      {session.proofIssued && (
        <section className="proof-pop mb-6 overflow-hidden rounded-2xl border border-violet/40 bg-[#151321] p-6 sm:p-8">
          <div className="grid items-center gap-7 md:grid-cols-[auto_1fr_auto]"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet text-void"><Seal/></div><div><p className="font-mono text-[11px] uppercase tracking-[.18em] text-violet">Skill proof recorded on Monad</p><h2 className="mt-2 text-2xl font-black">This learning session is now verifiable.</h2><p className="mt-2 text-sm text-mist">Student {shortAddress(session.student)} · {formatClock(elapsed)} · Tutor reputation +1</p></div>{receipt.data && <a className="button-secondary" href={`${MONAD_EXPLORER}/tx/${receipt.data.transactionHash}`} target="_blank" rel="noreferrer">View proof ↗</a>}</div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <section className="panel overflow-hidden rounded-2xl">
          <div className="relative aspect-video border-b border-line bg-black">
            {videoIsUnlocked && course ? <iframe key={`${course.slug}-${session.startedAt}`} className="absolute inset-0 h-full w-full" src={youtubeEmbedUrl(course)} title={`${course.title} lecture`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <div className="grid h-full place-items-center p-8 text-center"><div><span className={`mx-auto grid h-14 w-14 place-items-center rounded-full border ${isOutOfFunds ? "border-coral/50 text-coral" : "border-line text-mist"}`}>{isOutOfFunds ? "!" : "▶"}</span><p className="mt-5 font-semibold">{isOutOfFunds ? "Stream paused — out of tokens" : status === 3 ? "Lesson ended" : "Pay as you learn"}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mist">{isOutOfFunds ? "The lecture is hidden because the escrow is empty. Add MON to continue, or end the session." : isActive ? "No course video is linked to this custom session." : "The lecture stays blank until the student starts the on-chain payment stream."}</p>{isOutOfFunds && isStudent && <Link href={`/deposit/${sessionId}`} className="button-primary mt-5">Deposit more MON</Link>}</div></div>}
          </div>
          <div className="grid-lines px-5 py-12 text-center sm:px-10 sm:py-16"><p className="font-mono text-[11px] uppercase tracking-[.18em] text-mist">Paid learning time</p><p className="mt-5 font-mono text-[clamp(4.2rem,13vw,8rem)] font-bold leading-none tracking-[-.08em] number-tabular">{formatClock(displayedElapsed)}</p><div className="mx-auto mt-7 flex w-fit items-center gap-2 text-sm text-mist">{isOutOfFunds ? <><span className="h-2 w-2 rounded-full bg-coral"/> Paused · escrow empty</> : isActive ? <><span className="status-dot"/> Streaming {formatMon(pricePerSecond, 3)} MON/sec</> : status === 3 ? "Payment settled · proof stage open" : "Timer starts after the student confirms"}</div></div>
          <div className="border-t border-line p-5 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-line bg-void p-5"><p className="text-xs uppercase tracking-[.12em] text-mist">Paid to tutor</p><p className="mt-3 font-mono text-3xl font-bold text-signal number-tabular">{formatMon(accrued)} <span className="text-sm">MON</span></p></div><div className="rounded-xl border border-line bg-void p-5"><p className="text-xs uppercase tracking-[.12em] text-mist">Student balance</p><p className="mt-3 font-mono text-3xl font-bold number-tabular">{formatMon(remaining)} <span className="text-sm">MON</span></p></div></div><div className="mt-6"><div className="mb-2 flex justify-between text-xs text-mist"><span>Accrued</span><span>{progress.toFixed(2)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#292e38]"><div className="h-full bg-signal transition-[width] duration-500" style={{ width: `${progress}%` }}/></div></div></div>
        </section>

        <aside className="panel h-fit rounded-2xl p-6">
          <p className="eyebrow">Session controls</p>
          <dl className="mt-6 space-y-4 border-b border-line pb-6 text-sm"><div className="flex justify-between gap-4"><dt className="text-mist">Rate</dt><dd className="font-mono text-signal">{formatMon(pricePerSecond, 3)} MON/sec</dd></div><div className="flex justify-between gap-4"><dt className="text-mist">Escrow</dt><dd className="font-mono">{formatMon(session.depositedAmount, 3)} MON</dd></div><div className="flex justify-between gap-4"><dt className="text-mist">Student</dt><dd className="font-mono">{session.student === zeroAddress ? "Not funded" : shortAddress(session.student)}</dd></div></dl>

          {!isConnected ? <div className="mt-6"><p className="mb-4 text-sm leading-6 text-mist">Connect a wallet to fund or control this session.</p><ConnectButton/></div> : (
            <div className="mt-6">
              {status === 0 && !isTutor && <><p className="mb-4 text-sm leading-6 text-mist">Choose an on-chain deposit plan. Minimum 2 MON; larger plans pay a lower platform fee.</p><Link href={`/deposit/${sessionId}`} className="button-primary w-full">Choose deposit plan</Link></>}
              {status === 0 && isTutor && <p className="text-sm leading-6 text-mist">Share this page with a student. Tutors cannot fund their own offer.</p>}
              {status === 1 && isStudent && <button className="button-primary w-full" disabled={txBusy} onClick={() => transact("start")}>Start payment stream</button>}
              {status === 1 && !isStudent && <p className="text-sm leading-6 text-mist">Waiting for the student to start the stream.</p>}
              {status === 2 && (isStudent || isTutor) && <div className="grid gap-3"><button className="button-danger w-full" disabled={txBusy} onClick={() => transact("end")}>End & settle now</button>{isStudent && <Link href={`/deposit/${sessionId}`} className="button-secondary w-full">Add stream balance</Link>}</div>}
              {status === 2 && !isStudent && !isTutor && <p className="text-sm leading-6 text-mist">This stream is live. Only its tutor or student can end it.</p>}

              {status === 3 && !session.proofIssued && (
                <div>
                  <div className="grid grid-cols-2 gap-2 text-xs"><div className={`rounded-lg border p-3 ${session.studentAttested ? "border-signal/40 bg-signal/[.06] text-signal" : "border-line text-mist"}`}>Student<br/><strong>{session.studentAttested ? "Attested ✓" : "Pending"}</strong></div><div className={`rounded-lg border p-3 ${session.tutorAttested ? "border-signal/40 bg-signal/[.06] text-signal" : "border-line text-mist"}`}>Tutor<br/><strong>{session.tutorAttested ? "Attested ✓" : "Pending"}</strong></div></div>
                  {(isStudent || isTutor) && !hasAttested && <button className="button-primary mt-4 w-full" disabled={txBusy} onClick={() => transact("attest")}>Attest this session</button>}
                  {(isStudent || isTutor) && hasAttested && timeoutRemaining > 0 && <p className="mt-4 text-sm leading-6 text-mist">Your attestation is recorded. Waiting for the other wallet, or finalize in <span className="font-mono text-white">{formatClock(timeoutRemaining)}</span>.</p>}
                  {(isStudent || isTutor) && hasAttested && timeoutRemaining === 0 && <button className="button-primary mt-4 w-full" disabled={txBusy} onClick={() => transact("attest")}>Finalize proof after timeout</button>}
                  {!isStudent && !isTutor && <p className="mt-4 text-sm leading-6 text-mist">Both participants can now attest to create the skill proof.</p>}
                </div>
              )}
              {session.proofIssued && <div className="rounded-xl border border-violet/35 bg-violet/[.07] p-4"><p className="flex items-center gap-2 font-semibold text-violet"><Seal/> Proof minted</p><p className="mt-2 text-sm leading-6 text-mist">Both learning and tutor reputation are recorded on-chain.</p></div>}
              {txBusy && <p className="mt-4 text-sm text-mist">{isPending ? (action === "end" ? "Confirm end in your wallet — the stream stays live until submitted." : "Confirm in wallet…") : action === "end" ? "Settlement submitted to Monad — timer paused while confirming…" : `Confirming ${action ?? "transaction"} on Monad…`}</p>}
              {errorSummary(error) && <p className="mt-4 text-sm text-coral">{errorSummary(error)}</p>}
              {receipt.isError && <p className="mt-4 text-sm leading-6 text-coral">Monad did not confirm this transaction within 45 seconds. Check the transaction below; if the session is still live, you can safely retry.</p>}
              {hash && <a href={`${MONAD_EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" className="mt-4 block text-sm font-semibold text-signal hover:underline">View latest transaction ↗</a>}
            </div>
          )}
          <p className="mt-6 border-t border-line pt-5 text-xs leading-5 text-mist">The live counter previews on-chain accrual. Contract timestamps determine final payment, refund, duration, and proof.</p>
        </aside>
      </div>
    </main>
  );
}

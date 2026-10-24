import Link from "next/link";
import { ArrowUpRight, Bolt, Seal, ShieldCheck } from "@/components/icons";
import { SessionFeed } from "@/components/session-feed";
import { CourseCatalog } from "@/components/course-catalog";
import { MONAD_FAUCET } from "@/lib/chain";

export default function HomePage() {
  return (
    <main>
      <section className="grid-lines border-b border-line">
        <div className="shell grid min-h-[670px] items-center gap-14 py-20 lg:grid-cols-[1.04fr_.96fr]">
          <div>
            <p className="eyebrow mb-7">Pay for time · prove what you learned</p>
            <h1 className="max-w-3xl text-[clamp(3.5rem,8vw,7.2rem)] font-black leading-[.84] tracking-[-.075em]">Learn.<br/><span className="text-signal">Stream.</span> Prove.</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-mist">Real-time tutoring payments that end with something portable: a verifiable skill proof for the student and on-chain reputation for the tutor.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/create" className="button-primary">Create a session <ArrowUpRight/></Link><a href="#classes" className="button-secondary">Explore courses</a></div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-mist"><span className="flex items-center gap-2"><ShieldCheck/> Trustless escrow</span><span className="flex items-center gap-2"><Bolt/> Built for Monad speed</span></div>
          </div>

          <div className="panel relative overflow-hidden rounded-2xl p-5 sm:p-8">
            <div className="flex items-start justify-between border-b border-line pb-6"><div><p className="font-mono text-[11px] uppercase tracking-[.16em] text-mist">Illustrative live class</p><h2 className="mt-2 text-xl font-bold">MIT 6.100L · Python</h2></div><span className="flex items-center gap-2 text-xs font-semibold text-signal"><span className="status-dot"/> LIVE</span></div>
            <div className="py-8 text-center"><p className="font-mono text-6xl font-bold tracking-[-.07em] sm:text-7xl">00:06</p><p className="mt-3 text-sm text-mist">0.2 MON per second</p></div>
            <div className="relative h-1 overflow-hidden rounded-full bg-[#292e38] flow-line"/>
            <div className="mt-7 grid grid-cols-2 gap-4"><div className="rounded-xl border border-line bg-void p-4"><p className="text-xs uppercase tracking-wider text-mist">Tutor earned</p><p className="mt-2 font-mono text-xl font-bold text-signal">1.2000 MON</p></div><div className="rounded-xl border border-line bg-void p-4"><p className="text-xs uppercase tracking-wider text-mist">Stream balance</p><p className="mt-2 font-mono text-xl font-bold">0.6000 MON</p></div></div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-violet/30 bg-violet/[.06] p-4"><div className="flex items-center gap-3 text-violet"><Seal/><span className="text-sm font-semibold">Skill proof pending</span></div><span className="font-mono text-[10px] text-mist">2 attestations</span></div>
          </div>
        </div>
      </section>

      <section id="classes" className="shell py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Pay as you learn</p><h2 className="mt-3 text-4xl font-black tracking-[-.045em]">Choose a class</h2></div><p className="max-w-sm text-sm leading-6 text-mist">Pick an MIT course, choose an available tutor stream, and unlock the lecture while your per-second payment is active.</p></div>
        <CourseCatalog/>
      </section>

      <section id="sessions" className="border-t border-line"><div className="shell py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Live marketplace</p><h2 className="mt-3 text-4xl font-black tracking-[-.045em]">Open skill streams</h2></div><p className="max-w-sm text-sm leading-6 text-mist">Sessions and tutor scores are read directly from the ProofStream contract—no private reputation database.</p></div>
        <SessionFeed/>
      </div></section>

      <section className="border-y border-line bg-panel/40">
        <div className="shell grid py-16 md:grid-cols-3">
          {[
            ["01", "Escrow the budget", "The student locks native MON in a session-specific smart contract escrow."],
            ["02", "Pay only for time", "On-chain timestamps calculate a pro-rata rate for every second of tutoring."],
            ["03", "Turn learning into proof", "Mutual attestation records the skill and increments portable tutor reputation."],
          ].map(([step,title,copy]) => <div key={step} className="border-line py-6 md:border-l md:px-8 first:md:border-l-0 first:md:pl-0"><p className="font-mono text-xs text-signal">{step}</p><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-mist">{copy}</p></div>)}
        </div>
      </section>

      <section className="shell py-20"><div className="panel grid overflow-hidden rounded-2xl lg:grid-cols-[1fr_.85fr]"><div className="p-7 sm:p-12"><p className="eyebrow">Crypto-native outcome</p><h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-.05em]">A receipt proves payment. A ProofStream event proves progress.</h2><p className="mt-5 max-w-xl leading-7 text-mist">Every completed, attested session links student, tutor, subject, duration, and reputation in one lightweight on-chain record.</p></div><div className="grid-lines flex min-h-[260px] items-center justify-center border-t border-line p-8 lg:border-l lg:border-t-0"><div className="w-full max-w-sm -rotate-2 rounded-2xl border border-violet/40 bg-[#151321] p-6 shadow-2xl"><div className="flex items-center justify-between text-violet"><Seal/><span className="font-mono text-[10px] uppercase tracking-[.16em]">Verified on Monad</span></div><p className="mt-8 text-xs text-mist">SKILL PROOF #0042</p><p className="mt-2 text-2xl font-bold">MIT 6.100L · Python</p><div className="mt-7 grid grid-cols-2 gap-4 text-xs"><div><p className="text-mist">Paid learning</p><p className="mt-1 font-mono">28m 14s</p></div><div><p className="text-mist">Tutor rep</p><p className="mt-1 font-mono text-signal">+1</p></div></div></div></div></div></section>

      <footer className="shell flex flex-col gap-5 border-t border-line py-10 text-sm text-mist sm:flex-row sm:items-center sm:justify-between"><p>Built for Monad Blitz · Payment, proof, and reputation on-chain.</p><a href={MONAD_FAUCET} target="_blank" rel="noreferrer" className="font-semibold text-white hover:text-signal">Get testnet MON ↗</a></footer>
    </main>
  );
}

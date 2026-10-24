"use client";

import { useEffect, useState } from "react";

const plans = [
  { id: "starter", name: "Starter", tokens: "2,500", price: "₺200", note: "Short classes and focused practice" },
  { id: "plus", name: "Plus", tokens: "5,000", price: "₺350", note: "Best value for regular learners" },
  { id: "unlimited", name: "Unlimited", tokens: "∞", price: "₺1,000", note: "Unlimited demo learning access" }
] as const;

type PlanId = typeof plans[number]["id"];
type SettlementMode = "mon" | "studytoken";

const PLAN_KEY = "proofstream-demo-plan";
const MODE_KEY = "proofstream-demo-settlement";

export function TokenPlans() {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState<PlanId>();
  const [mode, setMode] = useState<SettlementMode>("mon");
  const activePlan = plans.find((plan) => plan.id === planId);

  useEffect(() => {
    const storedPlan = window.localStorage.getItem(PLAN_KEY) as PlanId | null;
    const storedMode = window.localStorage.getItem(MODE_KEY) as SettlementMode | null;
    if (plans.some((plan) => plan.id === storedPlan)) setPlanId(storedPlan ?? undefined);
    if (storedMode === "mon" || storedMode === "studytoken") setMode(storedMode);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    const openPlans = () => setOpen(true);
    window.addEventListener("proofstream-open-token-plans", openPlans);
    return () => window.removeEventListener("proofstream-open-token-plans", openPlans);
  }, []);

  function selectPlan(nextPlan: PlanId) {
    setPlanId(nextPlan);
    window.localStorage.setItem(PLAN_KEY, nextPlan);
    window.dispatchEvent(new CustomEvent("proofstream-demo-plan-change", { detail: { planId: nextPlan, mode } }));
  }

  function selectMode(nextMode: SettlementMode) {
    setMode(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
    window.dispatchEvent(new CustomEvent("proofstream-demo-plan-change", { detail: { planId, mode: nextMode } }));
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-violet/40 bg-violet/[.08] text-violet transition-colors hover:border-violet sm:h-11 sm:w-auto sm:grid-flow-col sm:gap-2 sm:px-3" aria-label="Open demo token plans">
        <span aria-hidden="true">◈</span><span className="hidden whitespace-nowrap font-mono text-xs font-bold sm:inline">{activePlan ? `${activePlan.tokens} TOK` : "Token plans"}</span>
      </button>

      {open && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="token-plan-title" className="panel my-auto w-full max-w-4xl rounded-2xl p-5 text-left sm:p-8" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-6"><div><p className="eyebrow">Visual demo credits</p><h2 id="token-plan-title" className="mt-3 text-3xl font-black tracking-[-.045em]">Choose your token plan.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-mist">Demo only. No TL payment, wallet transaction, real MON, or token minting occurs.</p></div><button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-void text-mist hover:text-white" onClick={() => setOpen(false)} aria-label="Close plans">×</button></div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {plans.map((plan) => <button type="button" key={plan.id} onClick={() => selectPlan(plan.id)} className={`rounded-xl border p-5 text-left transition-colors ${planId === plan.id ? "border-signal bg-signal/[.08]" : "border-line bg-void hover:border-mist"}`}><span className="text-xs uppercase tracking-[.14em] text-mist">{plan.name}</span><strong className="mt-4 block font-mono text-3xl text-white">{plan.tokens} <small className="text-sm text-signal">TOK</small></strong><span className="mt-3 block text-2xl font-black">{plan.price}</span><span className="mt-3 block text-xs leading-5 text-mist">{plan.note}</span><span className="mt-5 block font-mono text-xs text-signal">{planId === plan.id ? "SELECTED ✓" : "SELECT PLAN →"}</span></button>)}
          </div>

          <div className="mt-7 border-t border-line pt-7"><p className="text-xs uppercase tracking-[.14em] text-mist">Tutor settlement demo</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => selectMode("mon")} className={`rounded-xl border p-4 text-left ${mode === "mon" ? "border-signal bg-signal/[.07]" : "border-line bg-void"}`}><strong className="block">MON settlement</strong><span className="mt-2 block text-xs leading-5 text-mist">Plan credits unlock access. Tutor earnings stay displayed as real MON.</span></button><button type="button" onClick={() => selectMode("studytoken")} className={`rounded-xl border p-4 text-left ${mode === "studytoken" ? "border-violet bg-violet/[.07]" : "border-line bg-void"}`}><strong className="block">StudyToken settlement</strong><span className="mt-2 block text-xs leading-5 text-mist">The visual demo pays tutors from the selected STC credit balance.</span></button></div></div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-void p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-mist">Active demo: <b className="text-white">{activePlan ? `${activePlan.tokens} tokens` : "No plan selected"}</b> · <b className={mode === "mon" ? "text-signal" : "text-violet"}>{mode === "mon" ? "Tutor paid in MON" : "Tutor paid in StudyToken"}</b></span><button type="button" className="button-primary !min-h-10 !px-4 text-sm" onClick={() => setOpen(false)}>Use demo selection</button></div>
        </section>
      </div>}
    </>
  );
}

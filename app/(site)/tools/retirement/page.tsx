"use client";
export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";

type StepKey = "basics" | "lifestyle" | "savings" | "results";
type MoneyMode = "monthly" | "annual";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stripNonNumeric(s: string) {
  return s.replace(/[^\d.]/g, "");
}

function num(v: string) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(n))
  );
}

function pctLabel(n: number) {
  return `${Math.max(0, n).toFixed(0)}%`;
}

function pvOfAnnuity(monthly: number, annualReturn: number, years: number) {
  const n = Math.max(1, Math.round(years * 12));
  const r = (annualReturn / 100) / 12;
  if (r === 0) return monthly * n;
  return monthly * ((1 - Math.pow(1 + r, -n)) / r);
}

function fv(pv: number, annualReturn: number, years: number) {
  const r = annualReturn / 100;
  return pv * Math.pow(1 + r, Math.max(0, years));
}

function monthlyPMT(targetFV: number, currentPV: number, annualReturn: number, years: number) {
  const n = Math.max(1, Math.round(years * 12));
  const r = (annualReturn / 100) / 12;

  const fvCurrent = currentPV * Math.pow(1 + r, n);
  const gap = Math.max(targetFV - fvCurrent, 0);

  if (r === 0) return gap / n;
  return gap * (r / (Math.pow(1 + r, n) - 1));
}

function yearlyPMT(targetFV: number, currentPV: number, annualReturn: number, years: number) {
  const n = Math.max(1, Math.round(years));
  const r = annualReturn / 100;

  const fvCurrent = currentPV * Math.pow(1 + r, n);
  const gap = Math.max(targetFV - fvCurrent, 0);

  if (r === 0) return gap / n;
  return gap * (r / (Math.pow(1 + r, n) - 1));
}

function vibeFromGap(gap: number, yearsToRetire: number) {
  if (gap <= 0) return { label: "On track", tone: "cs-badge cs-badge-good" as const };
  if (yearsToRetire <= 5) return { label: "Tight runway", tone: "cs-badge cs-badge-warn" as const };
  if (gap >= 500000) return { label: "Big gap", tone: "cs-badge cs-badge-warn" as const };
  return { label: "Gap to plan", tone: "cs-badge cs-badge-risk" as const };
}

function StepPill(props: {
  k: StepKey;
  label: string;
  sub: string;
  step: StepKey;
  setStep: (s: StepKey) => void;
  disabled?: boolean;
}) {
  const order = ["basics", "lifestyle", "savings", "results"];
  const active = props.step === props.k;
  const done = order.indexOf(props.k) < order.indexOf(props.step);

  return (
    <button
      type="button"
      onClick={() => {
        if (props.disabled) return;
        props.setStep(props.k);
      }}
      className={[
        "group w-full text-left rounded-2xl px-4 py-3 transition",
        "border border-[var(--cs-border)]",
        props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        active
          ? "bg-white shadow-sm"
          : done
            ? "bg-[color:var(--cs-card)/0.65] hover:bg-white/80"
            : "bg-[color:var(--cs-card)/0.35] hover:bg-[color:var(--cs-card)/0.6]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{props.label}</div>
          <div className="text-xs text-[var(--cs-muted)] mt-0.5">{props.sub}</div>
        </div>
        <div
          className={[
            "h-8 w-8 rounded-xl flex items-center justify-center",
            active ? "bg-[var(--cs-card)]" : done ? "bg-emerald-50" : "bg-white/60",
          ].join(" ")}
          aria-hidden="true"
        >
          {done ? "✓" : active ? "●" : "○"}
        </div>
      </div>
    </button>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[var(--cs-muted)]">{props.label}</div>
      <div className="font-semibold text-[var(--cs-text)]">{props.value}</div>
    </div>
  );
}

export default function RetirementReadinessPage() {
  const [step, setStep] = useState<StepKey>("basics");
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [currentAge, setCurrentAge] = useState("25");
  const [retireAge, setRetireAge] = useState("65");
  const [endAge, setEndAge] = useState("90");

  const [monthlyExpenseToday, setMonthlyExpenseToday] = useState("3000");
  const [inflation, setInflation] = useState(3);

  const [expectedMonthlyIncomeAtRetirement, setExpectedMonthlyIncomeAtRetirement] = useState("0");

  const [currentRetirementSavings, setCurrentRetirementSavings] = useState("0");
  const [returnBeforeRetirement, setReturnBeforeRetirement] = useState(4);
  const [returnDuringRetirement, setReturnDuringRetirement] = useState(3);

  const inputs = useMemo(() => {
    const cur = Math.max(0, num(currentAge));
    const ra = Math.max(0, num(retireAge));
    const ea = Math.max(0, num(endAge));

    const yearsToRetire = Math.max(0, ra - cur);
    const yearsInRetirement = Math.max(1, ea - ra);

    return {
      cur,
      ra,
      ea,
      yearsToRetire,
      yearsInRetirement,
      expense: Math.max(0, num(monthlyExpenseToday)),
      infl: clamp(Math.max(0, inflation), 0, 8),
      incomeAtRet: Math.max(0, num(expectedMonthlyIncomeAtRetirement)),
      savings: Math.max(0, num(currentRetirementSavings)),
      rPre: clamp(Math.max(0, returnBeforeRetirement), 0, 10),
      rPost: clamp(Math.max(0, returnDuringRetirement), 0, 8),
    };
  }, [
    currentAge,
    retireAge,
    endAge,
    monthlyExpenseToday,
    inflation,
    expectedMonthlyIncomeAtRetirement,
    currentRetirementSavings,
    returnBeforeRetirement,
    returnDuringRetirement,
  ]);

  const result = useMemo(() => {
    if (inputs.expense <= 0) return null;

    const expenseAtRet = inputs.expense * Math.pow(1 + inputs.infl / 100, inputs.yearsToRetire);
    const netMonthlyNeedAtRet = Math.max(expenseAtRet - inputs.incomeAtRet, 0);

    const nestEggAtRet = pvOfAnnuity(netMonthlyNeedAtRet, inputs.rPost, inputs.yearsInRetirement);

    const fvCurrentSavingsAtRet = fv(inputs.savings, inputs.rPre, inputs.yearsToRetire);

    const gapAtRet = Math.max(nestEggAtRet - fvCurrentSavingsAtRet, 0);

    const monthlyNeeded = monthlyPMT(nestEggAtRet, inputs.savings, inputs.rPre, inputs.yearsToRetire);
    const yearlyNeeded = yearlyPMT(nestEggAtRet, inputs.savings, inputs.rPre, inputs.yearsToRetire);

    return {
      expenseAtRet,
      netMonthlyNeedAtRet,
      nestEggAtRet,
      fvCurrentSavingsAtRet,
      gapAtRet,
      monthlyNeeded,
      yearlyNeeded,
    };
  }, [inputs]);

  const progress = useMemo(() => {
    const idx = ["basics", "lifestyle", "savings", "results"].indexOf(step);
    return clamp(((idx + 1) / 4) * 100, 0, 100);
  }, [step]);

  const vibe = useMemo(() => {
    if (!result) return null;
    return vibeFromGap(result.gapAtRet, inputs.yearsToRetire);
  }, [result, inputs.yearsToRetire]);

  const timelinePct = useMemo(() => {
    const total = Math.max(1, inputs.yearsToRetire + inputs.yearsInRetirement);
    return clamp((inputs.yearsToRetire / total) * 100, 0, 100);
  }, [inputs.yearsToRetire, inputs.yearsInRetirement]);

  const summary = useMemo(() => {
    if (!result) return "";
    const setAside = moneyMode === "monthly" ? result.monthlyNeeded : result.yearlyNeeded;
    return `Retirement • Expense at retirement ~$${money(result.expenseAtRet)}/mo • Net need ~$${money(
      result.netMonthlyNeedAtRet
    )}/mo • Target nest egg ~$${money(result.nestEggAtRet)} • Gap ~$${money(result.gapAtRet)} • Suggested ${
      moneyMode === "monthly" ? "monthly" : "yearly"
    } ~$${money(setAside)} • Assumptions: infl ${inputs.infl}%, pre ${inputs.rPre}%, post ${inputs.rPost}%`;
  }, [result, moneyMode, inputs.infl, inputs.rPre, inputs.rPost]);

  function applyPreset(k: "simple" | "comfortable" | "lean") {
    if (k === "lean") setMonthlyExpenseToday("2200");
    if (k === "simple") setMonthlyExpenseToday("3000");
    if (k === "comfortable") setMonthlyExpenseToday("4500");
    setStep("lifestyle");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
        ← Back to tools
      </a>

      <div
        className={[
          "relative overflow-hidden rounded-[28px] border border-[var(--cs-border)]",
          "bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.55]",
          "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        ].join(" ")}
      >
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge">Educational</span>
                <span className="cs-badge">No product names</span>
                <span className="cs-badge">Assumptions-based</span>
                {vibe ? <span className={vibe.tone}>{vibe.label}</span> : null}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">Retirement Readiness</h1>
              <p className="text-[var(--cs-muted)] max-w-2xl">
                A simple retirement self-check: estimate your target “nest egg”, see the gap, and get a clean set-aside guide.
              </p>
            </div>

            <div className="lg:w-[380px]">
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 backdrop-blur p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Progress</div>
                  <div className="text-xs text-[var(--cs-muted)]">{Math.round(progress)}%</div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[color:var(--cs-card)/0.8] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--cs-accent, #6C5CE7)]"
                    style={{ width: `${progress}%`, transition: "width 300ms ease" }}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="text-xs text-[var(--cs-muted)]">Set-aside view</div>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMoneyMode("monthly")}
                      className={[
                        "px-3 py-1.5 rounded-xl text-xs border transition",
                        moneyMode === "monthly"
                          ? "bg-[var(--cs-card)] border-[var(--cs-border)]"
                          : "bg-white border-[var(--cs-border)] hover:bg-[var(--cs-card)]",
                      ].join(" ")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoneyMode("annual")}
                      className={[
                        "px-3 py-1.5 rounded-xl text-xs border transition",
                        moneyMode === "annual"
                          ? "bg-[var(--cs-card)] border-[var(--cs-border)]"
                          : "bg-white border-[var(--cs-border)] hover:bg-[var(--cs-card)]",
                      ].join(" ")}
                    >
                      Per year
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                  Tip: Keep it simple. Start with expenses + retirement income estimate, then refine assumptions.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <StepPill k="basics" label="Basics" sub="Ages + timeline" step={step} setStep={setStep} />
            <StepPill k="lifestyle" label="Lifestyle" sub="Expenses + inflation" step={step} setStep={setStep} />
            <StepPill k="savings" label="Savings" sub="Income + returns" step={step} setStep={setStep} />
            <StepPill
              k="results"
              label="Results"
              sub="Target + gap + set-aside"
              step={step}
              setStep={setStep}
              disabled={!result}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "basics" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Basics</div>
                  <div className="text-sm text-[var(--cs-muted)]">Just ages first. We’ll compute your retirement runway.</div>
                </div>

                <div className="h-12 w-12 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.8] flex items-center justify-center">
                  🧓
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Current age</div>
                  <input className="cs-input" inputMode="numeric" value={currentAge} onChange={(e) => setCurrentAge(stripNonNumeric(e.target.value))} />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Retirement age</div>
                  <input className="cs-input" inputMode="numeric" value={retireAge} onChange={(e) => setRetireAge(stripNonNumeric(e.target.value))} />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Plan until age</div>
                  <input className="cs-input" inputMode="numeric" value={endAge} onChange={(e) => setEndAge(stripNonNumeric(e.target.value))} />
                </label>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                <div className="text-sm font-semibold">Timeline (visual)</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">Now → retire → end age</div>

                <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--cs-accent, #6C5CE7)]"
                    style={{ width: `${timelinePct}%`, transition: "width 300ms ease" }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                  <span>Now ({inputs.cur})</span>
                  <span>Retire ({inputs.ra})</span>
                  <span>End ({inputs.ea})</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="cs-badge">Runway: {inputs.yearsToRetire} yrs</span>
                  <span className="cs-badge">Retirement years: {inputs.yearsInRetirement} yrs</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button type="button" className="cs-btn cs-btn-primary" onClick={() => setStep("lifestyle")}>
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "lifestyle" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="space-y-1">
                <div className="text-lg font-bold">Lifestyle</div>
                <div className="text-sm text-[var(--cs-muted)]">
                  How much you want to spend monthly (today dollars). We’ll inflate it to retirement.
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-5">
                <div className="text-sm font-semibold">Quick presets (optional)</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">Just to help users start fast — adjust anytime.</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("lean")}>
                    🥣 Lean
                  </button>
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("simple")}>
                    🙂 Simple
                  </button>
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("comfortable")}>
                    ✨ Comfortable
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Monthly expenses today (SGD)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={monthlyExpenseToday}
                    onChange={(e) => setMonthlyExpenseToday(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 3000"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">Your lifestyle estimate today.</div>
                </label>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Inflation: {pctLabel(inflation)}</div>
                  <input type="range" min={0} max={6} step={1} value={inflation} onChange={(e) => setInflation(Number(e.target.value))} className="w-full" />
                  <div className="text-xs text-[var(--cs-muted)]">Assumption only.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                <div className="text-sm font-semibold">Plain English</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="cs-badge">Expenses today = in today’s dollars</span>
                  <span className="cs-badge">Inflation = prices rise over time</span>
                  <span className="cs-badge">We estimate expenses at retirement</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("basics")}>
                  Back
                </button>
                <button type="button" className="cs-btn cs-btn-primary" onClick={() => setStep("savings")} disabled={inputs.expense <= 0}>
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "savings" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="space-y-1">
                <div className="text-lg font-bold">Savings</div>
                <div className="text-sm text-[var(--cs-muted)]">Add retirement income and your current savings.</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Expected monthly income at retirement (SGD)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={expectedMonthlyIncomeAtRetirement}
                    onChange={(e) => setExpectedMonthlyIncomeAtRetirement(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 1500"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">CPF LIFE / rental / other (your estimate).</div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Current retirement savings (SGD)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={currentRetirementSavings}
                    onChange={(e) => setCurrentRetirementSavings(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 50000"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Return before retirement: {pctLabel(returnBeforeRetirement)}</div>
                  <input type="range" min={0} max={8} step={1} value={returnBeforeRetirement} onChange={(e) => setReturnBeforeRetirement(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Return during retirement: {pctLabel(returnDuringRetirement)}</div>
                  <input type="range" min={0} max={6} step={1} value={returnDuringRetirement} onChange={(e) => setReturnDuringRetirement(Number(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-5">
                <div className="text-sm font-semibold">Mini note (so users don’t panic)</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1 leading-relaxed">
                  “Return” here is just an assumption to show how the math behaves. It’s not a promise and doesn’t reflect market ups/downs.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("lifestyle")}>
                  Back
                </button>
                <button type="button" className="cs-btn cs-btn-primary" onClick={() => setStep("results")} disabled={!result}>
                  See results
                </button>
              </div>
            </div>
          ) : null}

          {step === "results" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Results</div>
                  <div className="text-sm text-[var(--cs-muted)]">A clean snapshot: target, projected savings, gap, and set-aside.</div>
                </div>
                {vibe ? <span className={vibe.tone}>{vibe.label}</span> : null}
              </div>

              {!result ? (
                <div className="text-sm text-[var(--cs-muted)]">Enter expenses today to generate the estimate.</div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Expenses at retirement</div>
                      <div className="text-2xl font-bold">${money(result.expenseAtRet)}/mo</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Inflation applied for {inputs.yearsToRetire} years.</div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Net need (after income)</div>
                      <div className="text-2xl font-bold">${money(result.netMonthlyNeedAtRet)}/mo</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Income offset included.</div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Target “nest egg”</div>
                      <div className="text-2xl font-bold">${money(result.nestEggAtRet)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Funds to support retirement years.</div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                      <div className="text-sm font-semibold">Your runway</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="cs-badge">To retire: {inputs.yearsToRetire} yrs</span>
                        <span className="cs-badge">In retirement: {inputs.yearsInRetirement} yrs</span>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--cs-accent, #6C5CE7)]"
                          style={{ width: `${timelinePct}%`, transition: "width 300ms ease" }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                        <span>Now</span>
                        <span>Retire</span>
                        <span>End</span>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Projected savings at retirement</div>
                      <div className="text-2xl font-bold">${money(result.fvCurrentSavingsAtRet)}</div>

                      <div className="mt-3 text-sm text-[var(--cs-muted)]">Gap at retirement</div>
                      <div className="text-3xl font-bold">${money(result.gapAtRet)}</div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-sm text-[var(--cs-muted)]">
                        Suggested {moneyMode === "monthly" ? "monthly" : "yearly"} set-aside
                      </div>
                      <div className="text-3xl font-bold">
                        $
                        {money(
                          moneyMode === "monthly" ? result.monthlyNeeded : result.yearlyNeeded
                        )}
                      </div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Simplified educational guide (not advice).</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        className="cs-btn cs-btn-primary"
                        href={`/contact?tool=retirement&summary=${encodeURIComponent(summary)}`}
                      >
                        Request a chat
                      </a>
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("savings")}>
                        Adjust assumptions
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
                    Disclaimer: General information only. Not financial advice or a product recommendation. This estimate ignores taxes, fees, CPF balances/withdrawals detail, healthcare costs, market volatility, and personal circumstances.
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("savings")}>
                      Back
                    </button>
                    <a className="cs-btn cs-btn-ghost" href="/tools">
                      Back to tools
                    </a>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Live mini-summary</div>
            <div className="text-xs text-[var(--cs-muted)] mt-1">Keeps the user oriented.</div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Current age" value={String(inputs.cur)} />
              <Row label="Retire age" value={String(inputs.ra)} />
              <Row label="End age" value={String(inputs.ea)} />
              <Row label="Runway" value={`${inputs.yearsToRetire} yrs`} />
              <Row label="Retirement years" value={`${inputs.yearsInRetirement} yrs`} />
              <Row label="Inflation" value={pctLabel(inputs.infl)} />
              <Row label="Pre-ret return" value={pctLabel(inputs.rPre)} />
              <Row label="Post-ret return" value={pctLabel(inputs.rPost)} />
            </div>

            {result ? (
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-4">
                <div className="text-sm font-semibold">Gap</div>
                <div className="mt-1 text-2xl font-bold">${money(result.gapAtRet)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Target: ${money(result.nestEggAtRet)}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--cs-muted)]">Enter expenses today to generate.</div>
            )}
          </div>

          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Plain-English definitions</div>
            <ul className="mt-3 text-sm text-[var(--cs-muted)] space-y-2">
              <li>
                <span className="font-semibold text-[var(--cs-text)]">Nest egg</span>: a pot of money to support your retirement spending.
              </li>
              <li>
                <span className="font-semibold text-[var(--cs-text)]">Net need</span>: your spending minus retirement income.
              </li>
              <li>
                <span className="font-semibold text-[var(--cs-text)]">Gap</span>: how much more you may need by retirement.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

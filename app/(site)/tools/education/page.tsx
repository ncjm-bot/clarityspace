"use client";
export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";

type StepKey = "basics" | "costs" | "plan";
type MoneyMode = "monthly" | "annual";

const STEP_ORDER: StepKey[] = ["basics", "costs", "plan"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stripNonNumeric(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

function num(v: string) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));
}

function pctLabel(n: number) {
  return `${Math.max(0, n).toFixed(0)}%`;
}

function futureValue(pv: number, ratePct: number, years: number) {
  const r = ratePct / 100;
  return pv * Math.pow(1 + r, Math.max(0, years));
}

function monthlyPMT(targetFV: number, currentPV: number, annualReturnPct: number, years: number) {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualReturnPct / 100 / 12;

  const fvCurrent = currentPV * Math.pow(1 + r, n);
  const gap = Math.max(targetFV - fvCurrent, 0);

  if (r === 0) return gap / n;
  return gap * (r / (Math.pow(1 + r, n) - 1));
}

function yearlyPMT(targetFV: number, currentPV: number, annualReturnPct: number, years: number) {
  const n = Math.max(1, Math.round(years));
  const r = annualReturnPct / 100;

  const fvCurrent = currentPV * Math.pow(1 + r, n);
  const gap = Math.max(targetFV - fvCurrent, 0);

  if (r === 0) return gap / n;
  return gap * (r / (Math.pow(1 + r, n) - 1));
}

type YearRow = { yearIndex: number; age: number; annualCost: number };

function buildStudyCostSeries(
  annualCostToday: number,
  inflationPct: number,
  yearsToStart: number,
  studyYears: number,
  startAge: number
): { annualAtStart: number; totalFutureCost: number; rows: YearRow[] } {
  const annualAtStart = futureValue(annualCostToday, inflationPct, yearsToStart);

  let totalFutureCost = 0;
  const rows: YearRow[] = [];

  for (let i = 0; i < studyYears; i += 1) {
    const annual = futureValue(annualAtStart, inflationPct, i);
    totalFutureCost += annual;
    rows.push({ yearIndex: i + 1, age: startAge + i, annualCost: annual });
  }

  return { annualAtStart, totalFutureCost, rows };
}

function vibeFromInputs(yearsToStart: number, totalTarget: number) {
  if (yearsToStart <= 3) return { label: "Tight timeline", tone: "cs-badge cs-badge-warn" as const };
  if (totalTarget >= 300000) return { label: "Big goal", tone: "cs-badge cs-badge-warn" as const };
  return { label: "Steady plan", tone: "cs-badge cs-badge-good" as const };
}

function stepTitle(step: StepKey) {
  if (step === "basics") return "Basics";
  if (step === "costs") return "Costs";
  return "Plan";
}

function stepSubtitle(step: StepKey) {
  if (step === "basics") return "Ages + timeline to start.";
  if (step === "costs") return "Enter your estimate + inflation assumption.";
  return "See target + set-aside path (educational).";
}

function nextOf(step: StepKey): StepKey {
  const idx = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
}

function prevOf(step: StepKey): StepKey {
  const idx = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.max(idx - 1, 0)];
}

function CurrencyInput(props: {
  valueRaw: string;
  onChangeRaw: (raw: string) => void;
  placeholder?: string;
}) {
  const display = props.valueRaw ? money(num(props.valueRaw)) : "";
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
      <input
        inputMode="numeric"
        className="cs-input pl-7"
        value={display}
        onChange={(e) => props.onChangeRaw(stripNonNumeric(e.target.value))}
        placeholder={props.placeholder || "e.g. 25,000"}
      />
    </div>
  );
}

export default function EducationGoalPlannerPage() {
  const [step, setStep] = useState<StepKey>("basics");
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [childCurrentAge, setChildCurrentAge] = useState("3");
  const [startAge, setStartAge] = useState("18");
  const [studyYears, setStudyYears] = useState("4");

  const [annualCostToday, setAnnualCostToday] = useState("25000");
  const [educationInflation, setEducationInflation] = useState(4);

  const [currentSavings, setCurrentSavings] = useState("0");
  const [expectedReturn, setExpectedReturn] = useState(4);

  const inputs = useMemo(() => {
    const curAge = clamp(Math.floor(num(childCurrentAge)), 0, 30);
    const sAge = clamp(Math.floor(num(startAge)), 0, 40);
    const sYears = clamp(Math.max(1, Math.round(num(studyYears))), 1, 10);

    const yearsToStart = Math.max(0, sAge - curAge);

    return {
      curAge,
      sAge,
      sYears,
      yearsToStart,
      annualCost: Math.max(0, num(annualCostToday)),
      inflation: clamp(Math.max(0, educationInflation), 0, 10),
      savings: Math.max(0, num(currentSavings)),
      ret: clamp(Math.max(0, expectedReturn), 0, 10),
    };
  }, [childCurrentAge, startAge, studyYears, annualCostToday, educationInflation, currentSavings, expectedReturn]);

  const result = useMemo(() => {
    if (inputs.annualCost <= 0) return null;

    const { annualAtStart, totalFutureCost, rows } = buildStudyCostSeries(
      inputs.annualCost,
      inputs.inflation,
      inputs.yearsToStart,
      inputs.sYears,
      inputs.sAge
    );

    const monthlyNeeded = monthlyPMT(totalFutureCost, inputs.savings, inputs.ret, inputs.yearsToStart);
    const yearlyNeeded = yearlyPMT(totalFutureCost, inputs.savings, inputs.ret, inputs.yearsToStart);

    const fvSavingsAtStart = futureValue(inputs.savings, inputs.ret, inputs.yearsToStart);

    return {
      annualAtStart,
      totalFutureCost,
      yearsToStart: inputs.yearsToStart,
      fvSavingsAtStart,
      monthlyNeeded,
      yearlyNeeded,
      rows,
    };
  }, [inputs]);

  const basicsComplete = useMemo(() => {
    const okAges = inputs.sAge >= inputs.curAge;
    const okStudy = inputs.sYears >= 1;
    return okAges && okStudy;
  }, [inputs.sAge, inputs.curAge, inputs.sYears]);

  const costsComplete = useMemo(() => basicsComplete && inputs.annualCost > 0, [basicsComplete, inputs.annualCost]);

  const canAccess = useMemo(() => {
    return {
      basics: true,
      costs: basicsComplete,
      plan: costsComplete && Boolean(result),
    } as const;
  }, [basicsComplete, costsComplete, result]);

  const progress = useMemo(() => {
    const idx = STEP_ORDER.indexOf(step);
    return clamp(((idx + 1) / STEP_ORDER.length) * 100, 0, 100);
  }, [step]);

  const vibe = useMemo(() => {
    if (!result) return null;
    return vibeFromInputs(result.yearsToStart, result.totalFutureCost);
  }, [result]);

  const timelinePct = useMemo(() => {
    if (!result) return 0;
    const yearsToStart = Math.max(0, result.yearsToStart);
    const total = Math.max(1, yearsToStart + inputs.sYears);
    return clamp((yearsToStart / total) * 100, 0, 100);
  }, [result, inputs.sYears]);

  const setAside = useMemo(() => {
    if (!result) return 0;
    return moneyMode === "monthly" ? result.monthlyNeeded : result.yearlyNeeded;
  }, [result, moneyMode]);

  const summary = useMemo(() => {
    if (!result) return "";
    return [
      `Education Goal Planner`,
      `Child current age: ${inputs.curAge}`,
      `Start age: ${inputs.sAge}`,
      `Study years: ${inputs.sYears}`,
      `Annual cost today: $${money(inputs.annualCost)}`,
      `Education inflation (assumption): ${pctLabel(inputs.inflation)}`,
      `Current education savings: $${money(inputs.savings)}`,
      `Expected return (assumption): ${pctLabel(inputs.ret)}`,
      `Horizon: ${result.yearsToStart} years`,
      `Cost at start (per year): ~$${money(result.annualAtStart)}`,
      `Total target (all years): ~$${money(result.totalFutureCost)}`,
      `Suggested ${moneyMode === "monthly" ? "monthly" : "yearly"} set-aside: ~$${money(setAside)}`,
      `Anything you want to mention for me to take note:`,
    ].join("\n");
  }, [result, inputs, moneyMode, setAside]);

  function goNext() {
    const nxt = nextOf(step);
    if (nxt === "costs" && !canAccess.costs) return;
    if (nxt === "plan" && !canAccess.plan) return;
    setStep(nxt);
  }

  function goBack() {
    setStep(prevOf(step));
  }

  function StepPill(props: { k: StepKey; label: string; sub: string }) {
    const active = step === props.k;
    const locked = !canAccess[props.k];
    const idxNow = STEP_ORDER.indexOf(step);
    const idxThis = STEP_ORDER.indexOf(props.k);
    const done = idxThis < idxNow && !locked;

    return (
      <button
        type="button"
        onClick={() => {
          if (locked) return;
          setStep(props.k);
        }}
        disabled={locked}
        className={[
          "group w-full text-left rounded-2xl px-4 py-3 transition",
          "border border-[var(--cs-border)]",
          locked
            ? "bg-[color:var(--cs-card)/0.25] opacity-60 cursor-not-allowed"
            : active
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
              "h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0",
              active
                ? "bg-[color:var(--cs-card)/0.75] border-[color:var(--cs-border)]"
                : done
                  ? "bg-emerald-50 border-emerald-100"
                  : locked
                    ? "bg-white/60 border-[color:var(--cs-border)]"
                    : "bg-white/60 border-[color:var(--cs-border)]",
            ].join(" ")}
            aria-hidden="true"
          >
            <span className="text-sm">{done ? "✓" : locked ? "🔒" : active ? "●" : "○"}</span>
          </div>
        </div>
      </button>
    );
  }

  const sources = useMemo(
    () => [
      { label: "SingStat (official) – Consumer Price Index", href: "https://www.singstat.gov.sg/find-data/search-by-theme/economy/prices-and-price-indices/latest-data" },
      { label: "MOE (official) – Tuition Grant / fees info (starting point)", href: "https://www.moe.gov.sg/financial-matters/tuition-grant-scheme" },
    ],
    []
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
        ← Back to tools
      </a>

      <div
        className={[
          "relative overflow-hidden rounded-[30px] border border-[var(--cs-border)]",
          "bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.55]",
          "shadow-[0_14px_38px_rgba(0,0,0,0.07)]",
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

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Education Goal Planner</h1>
              <p className="text-[var(--cs-muted)] max-w-2xl">
                Set a rough education target and see a simple set-aside path. General information only — not advice and not a recommendation.
              </p>
            </div>

            <div className="lg:w-[400px]">
              <div className="rounded-[26px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-5 shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Progress</div>
                  <div className="text-xs text-[var(--cs-muted)]">{Math.round(progress)}%</div>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-[color:var(--cs-card)/0.85] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--cs-accent, #6C5CE7)]"
                    style={{ width: `${progress}%`, transition: "width 300ms ease" }}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="text-xs text-[var(--cs-muted)]">Set-aside view</div>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMoneyMode("monthly")}
                      className={[
                        "px-3 py-1.5 rounded-2xl text-xs border transition",
                        moneyMode === "monthly"
                          ? "bg-[color:var(--cs-card)/0.9] border-[color:var(--cs-border)]"
                          : "bg-white/70 border-[color:var(--cs-border)] hover:bg-[color:var(--cs-card)/0.9]",
                      ].join(" ")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoneyMode("annual")}
                      className={[
                        "px-3 py-1.5 rounded-2xl text-xs border transition",
                        moneyMode === "annual"
                          ? "bg-[color:var(--cs-card)/0.9] border-[color:var(--cs-border)]"
                          : "bg-white/70 border-[color:var(--cs-border)] hover:bg-[color:var(--cs-card)/0.9]",
                      ].join(" ")}
                    >
                      Per year
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                  Tip: Keep inputs rough first. The point is clarity, not “perfect prediction”.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StepPill k="basics" label="Basics" sub="Ages + horizon" />
            <StepPill k="costs" label="Costs" sub="Cost estimate + inflation" />
            <StepPill k="plan" label="Plan" sub="Target + set-aside" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "basics" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">{stepTitle(step)}</div>
                  <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
                </div>

                <div className="h-12 w-12 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.8] flex items-center justify-center">
                  🎓
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Child current age</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={childCurrentAge}
                    onChange={(e) => setChildCurrentAge(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 3"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Start age</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={startAge}
                    onChange={(e) => setStartAge(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 18"
                  />
                  {inputs.sAge < inputs.curAge ? (
                    <div className="text-xs text-rose-700">Start age should be ≥ current age.</div>
                  ) : (
                    <div className="text-xs text-[var(--cs-muted)]">Example: 18 for local uni start.</div>
                  )}
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Years of study</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={studyYears}
                    onChange={(e) => setStudyYears(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 4"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">Typical: 3–4 years (varies by programme).</div>
                </label>
              </div>

              <div className="rounded-[22px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                <div className="text-sm font-semibold">Quick plain-English check</div>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/75 border border-[var(--cs-border)] p-4">
                    <div className="text-xs text-[var(--cs-muted)]">Horizon</div>
                    <div className="text-sm font-semibold">{inputs.yearsToStart} years to start</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">From now till start age.</div>
                  </div>
                  <div className="rounded-2xl bg-white/75 border border-[var(--cs-border)] p-4">
                    <div className="text-xs text-[var(--cs-muted)]">Duration</div>
                    <div className="text-sm font-semibold">{inputs.sYears} years of study</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">How many years you’re funding.</div>
                  </div>
                  <div className="rounded-2xl bg-white/75 border border-[var(--cs-border)] p-4">
                    <div className="text-xs text-[var(--cs-muted)]">Outcome</div>
                    <div className="text-sm font-semibold">Target + set-aside</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Shown in the Plan step.</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!basicsComplete}>
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "costs" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="space-y-1">
                <div className="text-lg font-bold">{stepTitle(step)}</div>
                <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Annual cost today (SGD)</div>
                  <CurrencyInput
                    valueRaw={annualCostToday}
                    onChangeRaw={setAnnualCostToday}
                    placeholder="e.g. 25,000"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Your estimate: tuition + allowance + transport + materials.
                  </div>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Education inflation</div>
                    <span className="cs-badge">{pctLabel(educationInflation)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={educationInflation}
                    onChange={(e) => setEducationInflation(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    This is an assumption slider. For official inflation context, see SingStat CPI.
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/80 p-5">
                <div className="text-sm font-semibold">Sources (official starting points)</div>
                <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                  Use official pages to pick a “cost today” and sanity-check inflation assumptions:
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {sources.map((s) => (
                    <a
                      key={s.href}
                      className="cs-btn cs-btn-ghost justify-start"
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!costsComplete}>
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "plan" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">{stepTitle(step)}</div>
                  <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
                </div>
                {result ? <span className="cs-badge">Horizon: {result.yearsToStart} yrs</span> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Current education savings (SGD)</div>
                  <CurrencyInput valueRaw={currentSavings} onChangeRaw={setCurrentSavings} placeholder="e.g. 0" />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Expected return</div>
                    <span className="cs-badge">{pctLabel(expectedReturn)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Assumption slider (not a forecast). Higher return often means higher volatility.
                  </div>
                </div>
              </div>

              {!result ? (
                <div className="text-sm text-[var(--cs-muted)]">Enter an annual cost today to generate the estimate.</div>
              ) : (
                <>
                  <div className="rounded-[22px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                    <div className="text-sm font-semibold">Timeline</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Now → Start → Finish</div>

                    <div className="mt-3 h-2.5 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--cs-accent, #6C5CE7)]"
                        style={{ width: `${timelinePct}%`, transition: "width 300ms ease" }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                      <span>Now (age {inputs.curAge || 0})</span>
                      <span>Start (age {inputs.sAge || 0})</span>
                      <span>Finish (age {(inputs.sAge || 0) + (inputs.sYears || 0)})</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Cost at start (per year)</div>
                      <div className="text-2xl font-bold">${money(result.annualAtStart)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">After {result.yearsToStart} years of inflation (assumption).</div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Total target (all years)</div>
                      <div className="text-2xl font-bold">${money(result.totalFutureCost)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Sum across all study years (inflation applied).</div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Savings by start (if unchanged)</div>
                      <div className="text-2xl font-bold">${money(result.fvSavingsAtStart)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Based on expected return (assumption).</div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[var(--cs-border)] bg-white/85 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                    <div>
                      <div className="text-sm text-[var(--cs-muted)]">
                        Suggested {moneyMode === "monthly" ? "monthly" : "yearly"} set-aside
                      </div>
                      <div className="text-3xl font-bold">${money(setAside)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Educational estimate only — not advice.</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a className="cs-btn cs-btn-primary" href={`/contact?tool=education&summary=${encodeURIComponent(summary)}`}>
                        Request a chat
                      </a>
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("costs")}>
                        Adjust inputs
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                    <div className="text-sm font-semibold">Year-by-year (simple)</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Shows the first 6 years for readability.</div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {result.rows.slice(0, 6).map((r) => (
                        <div key={r.yearIndex} className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Year {r.yearIndex}</div>
                            <span className="cs-badge">Age {r.age}</span>
                          </div>
                          <div className="mt-2 text-xs text-[var(--cs-muted)]">Estimated annual cost</div>
                          <div className="text-xl font-bold">${money(r.annualCost)}</div>
                        </div>
                      ))}
                    </div>

                    {result.rows.length > 6 ? (
                      <div className="mt-3 text-xs text-[var(--cs-muted)]">Total target already includes all years.</div>
                    ) : null}
                  </div>

                  <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/80 p-5">
                    <div className="text-sm font-semibold">Important note</div>
                    <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                      Disclaimer: General information only. Not financial advice or a product recommendation. This estimate ignores taxes, fees,
                      market volatility, and real-world timing of contributions/withdrawals.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
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
          <div className="cs-card p-5 rounded-[22px] lg:sticky lg:top-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold">Live mini-summary</div>
            <div className="text-xs text-[var(--cs-muted)] mt-1">Keeps the user oriented.</div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Child age" value={inputs.curAge > 0 ? String(inputs.curAge) : "—"} />
              <Row label="Start age" value={inputs.sAge > 0 ? String(inputs.sAge) : "—"} />
              <Row label="Study years" value={String(inputs.sYears)} />
              <Row label="Horizon" value={`${inputs.yearsToStart} yrs`} />
              <Row label="Inflation" value={pctLabel(inputs.inflation)} />
              <Row label="Return" value={pctLabel(inputs.ret)} />
            </div>

            {result ? (
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-4">
                <div className="text-sm font-semibold">Total target</div>
                <div className="mt-1 text-2xl font-bold">${money(result.totalFutureCost)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">Cost at start: ${money(result.annualAtStart)}/yr</div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-4">
                <div className="text-xs text-[var(--cs-muted)]">Next step</div>
                <div className="mt-1 text-sm font-semibold text-[var(--cs-text)]">
                  Fill annual cost today to generate the plan.
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button type="button" className="cs-btn cs-btn-ghost w-full" onClick={goBack} disabled={step === "basics"}>
                Back
              </button>
              <button
                type="button"
                className="cs-btn cs-btn-primary w-full"
                onClick={goNext}
                disabled={
                  (step === "basics" && !basicsComplete) ||
                  (step === "costs" && !costsComplete) ||
                  step === "plan"
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Beginner-friendly tips</div>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
              <li>Use official school fee tables as your “cost today” starting point</li>
              <li>Keep inflation and return conservative if unsure</li>
              <li>Refine once the school plan is confirmed</li>
              <li>Use the “Request a chat” button if you want me to review your assumptions</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
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

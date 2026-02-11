"use client";
export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";

type StepKey = "basics" | "costs" | "plan";

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

function futureValue(pv: number, ratePct: number, years: number) {
  const r = ratePct / 100;
  return pv * Math.pow(1 + r, Math.max(0, years));
}

function monthlyPMT(targetFV: number, currentPV: number, annualReturnPct: number, years: number) {
  const n = Math.max(1, Math.round(years * 12));
  const r = (annualReturnPct / 100) / 12;

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

type YearRow = {
  yearIndex: number;
  age: number;
  annualCost: number;
};

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
    rows.push({
      yearIndex: i + 1,
      age: startAge + i,
      annualCost: annual,
    });
  }

  return { annualAtStart, totalFutureCost, rows };
}

function vibeFromInputs(yearsToStart: number, totalTarget: number) {
  if (yearsToStart <= 3) return { label: "Tight timeline", tone: "cs-badge cs-badge-warn" as const };
  if (totalTarget >= 300000) return { label: "Big goal", tone: "cs-badge cs-badge-warn" as const };
  return { label: "Steady plan", tone: "cs-badge cs-badge-good" as const };
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
    const curAge = num(childCurrentAge);
    const sAge = num(startAge);
    const sYears = Math.max(1, Math.round(num(studyYears)));

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
  }, [
    childCurrentAge,
    startAge,
    studyYears,
    annualCostToday,
    educationInflation,
    currentSavings,
    expectedReturn,
  ]);

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

  const progress = useMemo(() => {
    const idx = ["basics", "costs", "plan"].indexOf(step);
    return clamp(((idx + 1) / 3) * 100, 0, 100);
  }, [step]);

  const vibe = useMemo(() => {
    if (!result) return null;
    return vibeFromInputs(result.yearsToStart, result.totalFutureCost);
  }, [result]);

  const summary = useMemo(() => {
    if (!result) return "";
    const setAside = moneyMode === "monthly" ? result.monthlyNeeded : result.yearlyNeeded;
    return `Education Goal • Start in ${result.yearsToStart} yrs • Total target ~$${money(
      result.totalFutureCost
    )} • Cost at start ~$${money(result.annualAtStart)}/yr • Suggested ${
      moneyMode === "monthly" ? "monthly" : "yearly"
    } ~$${money(setAside)} • Assumptions: infl ${inputs.inflation}%, return ${inputs.ret}%`;
  }, [result, moneyMode, inputs.inflation, inputs.ret]);

  function applyPreset(key: "local" | "overseas" | "private") {
    if (key === "local") {
      setAnnualCostToday("25000");
      setEducationInflation(4);
    }
    if (key === "overseas") {
      setAnnualCostToday("60000");
      setEducationInflation(5);
    }
    if (key === "private") {
      setAnnualCostToday("40000");
      setEducationInflation(5);
    }
    setStep("costs");
  }

  function StepPill(props: { k: StepKey; label: string; sub: string }) {
    const active = step === props.k;
    const done =
      ["basics", "costs", "plan"].indexOf(props.k) < ["basics", "costs", "plan"].indexOf(step);

    return (
      <button
        type="button"
        onClick={() => {
          if (props.k === "basics") setStep("basics");
          if (props.k === "costs") setStep("costs");
          if (props.k === "plan") setStep(result ? "plan" : "costs");
        }}
        className={[
          "group w-full text-left rounded-2xl px-4 py-3 transition",
          "border border-[var(--cs-border)]",
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

  const timelinePct = useMemo(() => {
    if (!result) return 0;
    const yearsToStart = Math.max(0, result.yearsToStart);
    const total = Math.max(1, yearsToStart + inputs.sYears);
    return clamp((yearsToStart / total) * 100, 0, 100);
  }, [result, inputs.sYears]);

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

              <h1 className="text-3xl sm:text-4xl font-bold">Education Goal Planner</h1>
              <p className="text-[var(--cs-muted)] max-w-2xl">
                Set a rough education target and see a simple set-aside path. It’s a planner — not advice and
                not a recommendation.
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
                  Tip: Start with a simple estimate first. You can refine later (inflation and returns can be adjusted).
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StepPill k="basics" label="Basics" sub="Ages + horizon" />
            <StepPill k="costs" label="Costs" sub="What school might cost" />
            <StepPill k="plan" label="Plan" sub="Target + set-aside path" />
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
                  <div className="text-sm text-[var(--cs-muted)]">
                    We’ll calculate the time to start + show a timeline.
                  </div>
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
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Start age (e.g. 18)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={startAge}
                    onChange={(e) => setStartAge(stripNonNumeric(e.target.value))}
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Years of study</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={studyYears}
                    onChange={(e) => setStudyYears(stripNonNumeric(e.target.value))}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                <div className="text-sm font-semibold">Quick presets (optional)</div>
                <div className="text-sm text-[var(--cs-muted)] mt-1">
                  Just to help users start faster — you can change numbers anytime.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("local")}>
                    🇸🇬 Local Uni starter
                  </button>
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("private")}>
                    🏫 Private starter
                  </button>
                  <button type="button" className="cs-btn cs-btn-ghost" onClick={() => applyPreset("overseas")}>
                    ✈️ Overseas starter
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  className="cs-btn cs-btn-primary"
                  onClick={() => setStep("costs")}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "costs" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="space-y-1">
                <div className="text-lg font-bold">Costs</div>
                <div className="text-sm text-[var(--cs-muted)]">
                  Enter today’s annual cost (your estimate). We’ll inflate it to the start year and across study years.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Annual cost today (SGD)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={annualCostToday}
                    onChange={(e) => setAnnualCostToday(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 25000"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Tuition + allowance + transport + materials (rough estimate).
                  </div>
                </label>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Education inflation: {pctLabel(educationInflation)}</div>
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
                    Assumption only. Use 0–8% depending on how conservative you want.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-5">
                <div className="text-sm font-semibold">Make it less confusing (plain English)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="cs-badge">“Cost today” = cost right now</span>
                  <span className="cs-badge">Inflation = future price increase</span>
                  <span className="cs-badge">We sum all study years</span>
                </div>
                <div className="text-xs text-[var(--cs-muted)] mt-2 leading-relaxed">
                  Example: If annual cost today is $25,000 and inflation is 4%, the cost at 18 years old will be higher.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("basics")}>
                  Back
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn-primary"
                  onClick={() => setStep("plan")}
                  disabled={inputs.annualCost <= 0}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "plan" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Plan</div>
                  <div className="text-sm text-[var(--cs-muted)]">
                    Add savings + expected return to see a simple set-aside path.
                  </div>
                </div>
                {result ? <span className="cs-badge">Horizon: {result.yearsToStart} yrs</span> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Current education savings (SGD)</div>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 0"
                  />
                </label>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Expected return: {pctLabel(expectedReturn)}</div>
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
                    Educational assumption, not a forecast. Higher return usually means higher volatility.
                  </div>
                </div>
              </div>

              {!result ? (
                <div className="text-sm text-[var(--cs-muted)]">
                  Enter an annual cost today to generate the estimate.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                    <div className="text-sm font-semibold">Timeline</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">
                      Now → Start school → Finish
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
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
                      <div className="text-xs text-[var(--cs-muted)] mt-1">
                        After {result.yearsToStart} years of inflation.
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Total target (all years)</div>
                      <div className="text-2xl font-bold">${money(result.totalFutureCost)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">
                        Sum of all study years (inflation applied).
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-sm text-[var(--cs-muted)]">Savings by start (if unchanged)</div>
                      <div className="text-2xl font-bold">${money(result.fvSavingsAtStart)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">
                        Based on expected return (assumption).
                      </div>
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
                      <div className="text-xs text-[var(--cs-muted)] mt-1">
                        Simplified educational guide — not advice.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        className="cs-btn cs-btn-primary"
                        href={`/contact?tool=education&summary=${encodeURIComponent(summary)}`}
                      >
                        Request a chat
                      </a>
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("costs")}>
                        Adjust assumptions
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                    <div className="text-sm font-semibold">Year-by-year (simple)</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">
                      This is helpful for parents who want to “see the steps”.
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {result.rows.slice(0, 6).map((r) => (
                        <div
                          key={r.yearIndex}
                          className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4"
                        >
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
                      <div className="mt-3 text-xs text-[var(--cs-muted)]">
                        Showing first 6 years only. Total target already includes all years.
                      </div>
                    ) : null}
                  </div>

                  <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
                    Disclaimer: General information only. Not financial advice or a product recommendation. This estimate ignores taxes, fees, market volatility, and real-world timing of contributions/withdrawals.
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("costs")}>
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
            <div className="text-xs text-[var(--cs-muted)] mt-1">
              Keeps the user oriented.
            </div>

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
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Cost at start: ${money(result.annualAtStart)}/yr
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--cs-muted)]">
                Enter annual cost today to generate.
              </div>
            )}
          </div>

          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Beginner-friendly tips</div>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
              <li>Start with a rough annual cost today</li>
              <li>Use 4–5% inflation if unsure</li>
              <li>Use 3–5% return if conservative</li>
              <li>Then refine after you know the school plan</li>
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

"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));
}

function pct(n: number) {
  return `${Math.max(0, n).toFixed(0)}%`;
}

function futureValue(pv: number, rate: number, years: number) {
  const r = rate / 100;
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

export default function EducationGoalPlannerPage() {
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
      inflation: Math.max(0, educationInflation),
      savings: Math.max(0, num(currentSavings)),
      ret: Math.max(0, expectedReturn),
    };
  }, [childCurrentAge, startAge, studyYears, annualCostToday, educationInflation, currentSavings, expectedReturn]);

  const result = useMemo(() => {
    if (inputs.annualCost <= 0) return null;

    const annualAtStart = futureValue(inputs.annualCost, inputs.inflation, inputs.yearsToStart);

    let totalFutureCost = 0;
    for (let i = 0; i < inputs.sYears; i += 1) {
      totalFutureCost += futureValue(annualAtStart, inputs.inflation, i);
    }

    const monthlyNeeded = monthlyPMT(totalFutureCost, inputs.savings, inputs.ret, inputs.yearsToStart);

    const fvSavingsAtStart = futureValue(inputs.savings, inputs.ret, inputs.yearsToStart);

    return {
      annualAtStart,
      totalFutureCost,
      yearsToStart: inputs.yearsToStart,
      fvSavingsAtStart,
      monthlyNeeded,
    };
  }, [inputs]);

  const summary = useMemo(() => {
    if (!result) return "";
    return `Education Goal • Cost at start ~$${money(result.annualAtStart)}/yr • Total target ~$${money(result.totalFutureCost)} • Horizon ${result.yearsToStart} yrs • Suggested monthly ~$${money(result.monthlyNeeded)}`;
  }, [result]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
          ← Back to tools
        </a>
        <h1 className="text-3xl font-bold">Education Goal Planner</h1>
        <p className="text-[var(--cs-muted)]">
          Educational estimate of a future education target and a simple monthly savings guide. No product names, no comparisons, not a recommendation.
        </p>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Child current age</div>
            <input className="cs-input" inputMode="numeric" value={childCurrentAge} onChange={(e) => setChildCurrentAge(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Start age (e.g. 18)</div>
            <input className="cs-input" inputMode="numeric" value={startAge} onChange={(e) => setStartAge(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Years of study</div>
            <input className="cs-input" inputMode="numeric" value={studyYears} onChange={(e) => setStudyYears(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Annual cost today (SGD)</div>
            <input className="cs-input" inputMode="numeric" value={annualCostToday} onChange={(e) => setAnnualCostToday(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 25000" />
            <div className="text-xs text-[var(--cs-muted)]">Tuition + allowance + materials (your estimate).</div>
          </label>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Education inflation: {pct(educationInflation)}</div>
            <input type="range" min={0} max={8} step={1} value={educationInflation} onChange={(e) => setEducationInflation(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-[var(--cs-muted)]">Assumption only. Adjust to match your belief.</div>
          </div>
        </div>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Savings inputs</h2>
          {result && <span className="cs-badge">Horizon: {result.yearsToStart} yrs</span>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Current education savings (SGD)</div>
            <input className="cs-input" inputMode="numeric" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 0" />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Expected return: {pct(expectedReturn)}</div>
            <input type="range" min={0} max={8} step={1} value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-[var(--cs-muted)]">Educational assumption, not a forecast.</div>
          </div>
        </div>

        {!result ? (
          <div className="text-sm text-[var(--cs-muted)]">Enter an annual cost today to generate the estimate.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Cost at start (per year)</div>
                <div className="text-xl font-bold">${money(result.annualAtStart)}</div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Total target (all years)</div>
                <div className="text-xl font-bold">${money(result.totalFutureCost)}</div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Savings by start (if unchanged)</div>
                <div className="text-xl font-bold">${money(result.fvSavingsAtStart)}</div>
              </div>
            </div>

            <div className="cs-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm text-[var(--cs-muted)]">Suggested monthly set-aside</div>
                <div className="text-2xl font-bold">${money(result.monthlyNeeded)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">This is a simplified educational guide (not advice).</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a className="cs-btn cs-btn-primary" href={`/contact?tool=education&summary=${encodeURIComponent(summary)}`}>
                  Request a chat
                </a>
                <a className="cs-btn cs-btn-ghost" href="/tools">
                  Back to tools
                </a>
              </div>
            </div>

            <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
              Disclaimer: General information only. Not financial advice or a product recommendation. This estimate ignores taxes, fees, policy terms, market volatility, and real-world timing of contributions/withdrawals.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

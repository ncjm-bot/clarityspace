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

export default function RetirementReadinessPage() {
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
      infl: Math.max(0, inflation),
      incomeAtRet: Math.max(0, num(expectedMonthlyIncomeAtRetirement)),
      savings: Math.max(0, num(currentRetirementSavings)),
      rPre: Math.max(0, returnBeforeRetirement),
      rPost: Math.max(0, returnDuringRetirement),
    };
  }, [currentAge, retireAge, endAge, monthlyExpenseToday, inflation, expectedMonthlyIncomeAtRetirement, currentRetirementSavings, returnBeforeRetirement, returnDuringRetirement]);

  const result = useMemo(() => {
    if (inputs.expense <= 0) return null;

    const expenseAtRet = inputs.expense * Math.pow(1 + inputs.infl / 100, inputs.yearsToRetire);

    const netMonthlyNeedAtRet = Math.max(expenseAtRet - inputs.incomeAtRet, 0);

    const nestEggAtRet = pvOfAnnuity(netMonthlyNeedAtRet, inputs.rPost, inputs.yearsInRetirement);

    const fvCurrentSavingsAtRet = fv(inputs.savings, inputs.rPre, inputs.yearsToRetire);

    const gapAtRet = Math.max(nestEggAtRet - fvCurrentSavingsAtRet, 0);

    const monthlyNeeded = monthlyPMT(nestEggAtRet, inputs.savings, inputs.rPre, inputs.yearsToRetire);

    return {
      expenseAtRet,
      netMonthlyNeedAtRet,
      nestEggAtRet,
      fvCurrentSavingsAtRet,
      gapAtRet,
      monthlyNeeded,
    };
  }, [inputs]);

  const summary = useMemo(() => {
    if (!result) return "";
    return `Retirement • Expense at retirement ~$${money(result.expenseAtRet)}/mo • Net need ~$${money(result.netMonthlyNeedAtRet)}/mo • Target nest egg ~$${money(result.nestEggAtRet)} • Suggested monthly ~$${money(result.monthlyNeeded)}`;
  }, [result]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
          ← Back to tools
        </a>
        <h1 className="text-3xl font-bold">Retirement Readiness</h1>
        <p className="text-[var(--cs-muted)]">
          Educational estimate of a retirement target and potential shortfall. No product names, no comparisons, not a recommendation.
        </p>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Current age</div>
            <input className="cs-input" inputMode="numeric" value={currentAge} onChange={(e) => setCurrentAge(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Retirement age</div>
            <input className="cs-input" inputMode="numeric" value={retireAge} onChange={(e) => setRetireAge(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Plan until age</div>
            <input className="cs-input" inputMode="numeric" value={endAge} onChange={(e) => setEndAge(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Monthly expenses today (SGD)</div>
            <input className="cs-input" inputMode="numeric" value={monthlyExpenseToday} onChange={(e) => setMonthlyExpenseToday(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 3000" />
            <div className="text-xs text-[var(--cs-muted)]">Your lifestyle estimate today.</div>
          </label>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Inflation: {pct(inflation)}</div>
            <input type="range" min={0} max={6} step={1} value={inflation} onChange={(e) => setInflation(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-[var(--cs-muted)]">Assumption only.</div>
          </div>
        </div>
      </div>

      <div className="cs-card p-6 space-y-5">
        <h2 className="text-lg font-bold">Income and savings</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Expected monthly income at retirement (SGD)</div>
            <input className="cs-input" inputMode="numeric" value={expectedMonthlyIncomeAtRetirement} onChange={(e) => setExpectedMonthlyIncomeAtRetirement(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 1500" />
            <div className="text-xs text-[var(--cs-muted)]">CPF LIFE / rental / other (your estimate).</div>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Current retirement savings (SGD)</div>
            <input className="cs-input" inputMode="numeric" value={currentRetirementSavings} onChange={(e) => setCurrentRetirementSavings(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 50000" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Return before retirement: {pct(returnBeforeRetirement)}</div>
            <input type="range" min={0} max={8} step={1} value={returnBeforeRetirement} onChange={(e) => setReturnBeforeRetirement(Number(e.target.value))} className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Return during retirement: {pct(returnDuringRetirement)}</div>
            <input type="range" min={0} max={6} step={1} value={returnDuringRetirement} onChange={(e) => setReturnDuringRetirement(Number(e.target.value))} className="w-full" />
          </div>
        </div>

        {!result ? (
          <div className="text-sm text-[var(--cs-muted)]">Enter monthly expenses today to generate the estimate.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Expenses at retirement</div>
                <div className="text-xl font-bold">${money(result.expenseAtRet)}/mo</div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Net need after income</div>
                <div className="text-xl font-bold">${money(result.netMonthlyNeedAtRet)}/mo</div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Target “nest egg”</div>
                <div className="text-xl font-bold">${money(result.nestEggAtRet)}</div>
              </div>
            </div>

            <div className="cs-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm text-[var(--cs-muted)]">Suggested monthly set-aside</div>
                <div className="text-2xl font-bold">${money(result.monthlyNeeded)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Simplified guide based on assumptions (not advice).
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a className="cs-btn cs-btn-primary" href={`/contact?tool=retirement&summary=${encodeURIComponent(summary)}`}>
                  Request a chat
                </a>
                <a className="cs-btn cs-btn-ghost" href="/tools">
                  Back to tools
                </a>
              </div>
            </div>

            <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
              Disclaimer: General information only. Not financial advice or a product recommendation. This estimate ignores taxes, fees, CPF balances/withdrawals detail, market volatility, and personal healthcare needs.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

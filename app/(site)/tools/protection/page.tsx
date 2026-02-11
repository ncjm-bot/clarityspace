"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number) {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("en-SG");
}

type Outputs = {
  deathNeed: number;
  tpdNeed: number;
  ciNeed: number;
  deathGap: number;
  tpdGap: number;
  ciGap: number;
  totalGap: number;
  riskLabel: "LOW" | "MODERATE" | "RISK";
};

function riskFromTotalGap(totalGap: number, monthlyCommitments: number) {
  const annual = Math.max(1, monthlyCommitments * 12);
  const ratio = totalGap / annual;
  if (ratio <= 8) return "LOW";
  if (ratio <= 20) return "MODERATE";
  return "RISK";
}

export default function ProtectionGapTool() {
  const [monthlyCommitments, setMonthlyCommitments] = useState<string>("");
  const [yearsToSupport, setYearsToSupport] = useState<string>("20");
  const [oneTimeCosts, setOneTimeCosts] = useState<string>("");

  const [incomeReplacePct, setIncomeReplacePct] = useState<number>(60);
  const [ciMonthsCover, setCiMonthsCover] = useState<number>(24);

  const [existingDeath, setExistingDeath] = useState<string>("");
  const [existingTPD, setExistingTPD] = useState<string>("");
  const [existingCI, setExistingCI] = useState<string>("");

  const parsed = useMemo(() => {
    const m = Number(monthlyCommitments || 0);
    const y = Number(yearsToSupport || 0);
    const otc = Number(oneTimeCosts || 0);

    const d = Number(existingDeath || 0);
    const t = Number(existingTPD || 0);
    const c = Number(existingCI || 0);

    return {
      monthly: Number.isFinite(m) ? m : 0,
      years: Number.isFinite(y) ? y : 0,
      otc: Number.isFinite(otc) ? otc : 0,
      exDeath: Number.isFinite(d) ? d : 0,
      exTPD: Number.isFinite(t) ? t : 0,
      exCI: Number.isFinite(c) ? c : 0,
    };
  }, [monthlyCommitments, yearsToSupport, oneTimeCosts, existingDeath, existingTPD, existingCI]);

  const outputs: Outputs | null = useMemo(() => {
    if (parsed.monthly <= 0 || parsed.years <= 0) return null;

    const supportNeed = parsed.monthly * 12 * parsed.years;
    const deathNeed = supportNeed + Math.max(parsed.otc, 0);

    const tpdNeed = (parsed.monthly * 12 * parsed.years) * (incomeReplacePct / 100);

    const ciNeed = parsed.monthly * ciMonthsCover;

    const deathGap = Math.max(deathNeed - parsed.exDeath, 0);
    const tpdGap = Math.max(tpdNeed - parsed.exTPD, 0);
    const ciGap = Math.max(ciNeed - parsed.exCI, 0);

    const totalGap = deathGap + tpdGap + ciGap;
    const riskLabel = riskFromTotalGap(totalGap, parsed.monthly);

    return {
      deathNeed,
      tpdNeed,
      ciNeed,
      deathGap,
      tpdGap,
      ciGap,
      totalGap,
      riskLabel,
    };
  }, [parsed, incomeReplacePct, ciMonthsCover]);

  const summaryText = useMemo(() => {
    if (!outputs) return "";
    return `Protection Gap • Death gap $${formatMoney(outputs.deathGap)} • TPD gap $${formatMoney(outputs.tpdGap)} • CI gap $${formatMoney(outputs.ciGap)} • Total gap $${formatMoney(outputs.totalGap)} • Risk ${outputs.riskLabel}`;
  }, [outputs]);

  const riskBadgeClass = useMemo(() => {
    if (!outputs) return "cs-badge";
    if (outputs.riskLabel === "LOW") return "cs-badge cs-badge-good";
    if (outputs.riskLabel === "MODERATE") return "cs-badge cs-badge-warn";
    return "cs-badge cs-badge-risk";
  }, [outputs]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
          ← Back to tools
        </a>
        <h1 className="text-3xl font-bold">Protection Gap Check</h1>
        <p className="text-[var(--cs-muted)]">
          Educational estimate of potential shortfalls across Death / TPD / Critical Illness.
          No product names. No comparisons. Not a recommendation.
        </p>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Monthly commitments (SGD)</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={monthlyCommitments}
              onChange={(e) => setMonthlyCommitments(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 3000"
            />
            <div className="text-xs text-[var(--cs-muted)]">
              Household essentials + bills you want covered (education, loans, parents allowance, etc.)
            </div>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Years to provide for</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={yearsToSupport}
              onChange={(e) => setYearsToSupport(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 20"
            />
            <div className="text-xs text-[var(--cs-muted)]">
              How long you want support to last.
            </div>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">One-time costs (optional)</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={oneTimeCosts}
              onChange={(e) => setOneTimeCosts(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 30000"
            />
            <div className="text-xs text-[var(--cs-muted)]">
              Funeral / final expenses / outstanding one-off needs.
            </div>
          </label>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Assumptions (adjustable)</div>

            <div className="cs-card p-4">
              <div className="text-sm font-semibold">
                TPD income replacement: {incomeReplacePct}%
              </div>
              <input
                type="range"
                min={30}
                max={100}
                value={incomeReplacePct}
                onChange={(e) => setIncomeReplacePct(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-[var(--cs-muted)]">
                Simplified estimate. Actual needs vary based on earning years and expenses.
              </div>
            </div>

            <div className="cs-card p-4">
              <div className="text-sm font-semibold">
                CI coverage period: {ciMonthsCover} months
              </div>
              <input
                type="range"
                min={6}
                max={60}
                step={6}
                value={ciMonthsCover}
                onChange={(e) => setCiMonthsCover(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-[var(--cs-muted)]">
                Simple “income pause” view (recovery / time off work).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Your existing coverage (optional)</h2>
          {outputs && <span className={riskBadgeClass}>{outputs.riskLabel}</span>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Death (SGD)</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={existingDeath}
              onChange={(e) => setExistingDeath(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 500000"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">TPD (SGD)</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={existingTPD}
              onChange={(e) => setExistingTPD(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 500000"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Critical Illness (SGD)</div>
            <input
              inputMode="numeric"
              className="cs-input"
              value={existingCI}
              onChange={(e) => setExistingCI(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 200000"
            />
          </label>
        </div>

        {!outputs ? (
          <div className="text-sm text-[var(--cs-muted)]">
            Enter monthly commitments and years to generate your educational estimate.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">Death need</div>
                <div className="text-xl font-bold">${formatMoney(outputs.deathNeed)}</div>
                <div className="text-sm mt-2">
                  <span className="text-[var(--cs-muted)]">Gap: </span>
                  <span className={outputs.deathGap > 0 ? "cs-badge cs-badge-risk" : "cs-badge cs-badge-good"}>
                    ${formatMoney(outputs.deathGap)}
                  </span>
                </div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">TPD need</div>
                <div className="text-xl font-bold">${formatMoney(outputs.tpdNeed)}</div>
                <div className="text-sm mt-2">
                  <span className="text-[var(--cs-muted)]">Gap: </span>
                  <span className={outputs.tpdGap > 0 ? "cs-badge cs-badge-risk" : "cs-badge cs-badge-good"}>
                    ${formatMoney(outputs.tpdGap)}
                  </span>
                </div>
              </div>

              <div className="cs-card p-4">
                <div className="text-sm text-[var(--cs-muted)]">CI need</div>
                <div className="text-xl font-bold">${formatMoney(outputs.ciNeed)}</div>
                <div className="text-sm mt-2">
                  <span className="text-[var(--cs-muted)]">Gap: </span>
                  <span className={outputs.ciGap > 0 ? "cs-badge cs-badge-risk" : "cs-badge cs-badge-good"}>
                    ${formatMoney(outputs.ciGap)}
                  </span>
                </div>
              </div>
            </div>

            <div className="cs-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm text-[var(--cs-muted)]">Total estimated shortfall</div>
                <div className="text-2xl font-bold">${formatMoney(outputs.totalGap)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Educational estimate based on inputs + assumptions.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  className="cs-btn cs-btn-primary"
                  href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}
                >
                  Request a chat
                </a>
                <a className="cs-btn cs-btn-ghost" href="/tools">
                  Back to tools
                </a>
              </div>
            </div>

            <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
              Disclaimer: General information only. Not financial advice or a product recommendation.
              This does not account for medical inflation, investment returns, CPF, liabilities detail, or policy terms.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

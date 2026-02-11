"use client";

import { useMemo, useState } from "react";

type Result = {
  bufferMonths: number;
  bufferScore: number;
  shockNeed: number;
  shockGap: number;
  dependents: number;
  overallScore: number;
  level: "Low" | "Moderate" | "Strong";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatMoney(n: number) {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("en-SG");
}

function bufferScoreFromMonths(months: number) {
  if (months <= 0) return 0;
  if (months < 1) return 10;
  if (months < 3) return 30;
  if (months < 6) return 60;
  if (months < 12) return 85;
  return 95;
}

function levelBadgeClass(level: Result["level"]) {
  if (level === "Strong") return "cs-badge cs-badge-good";
  if (level === "Moderate") return "cs-badge cs-badge-warn";
  return "cs-badge cs-badge-risk";
}

function levelLabel(level: Result["level"]) {
  return level === "Low" ? "RISK" : level.toUpperCase();
}

export default function ResilienceScoreTool() {
  const [monthlyEssentials, setMonthlyEssentials] = useState<string>("");
  const [liquidSavings, setLiquidSavings] = useState<string>("");
  const [dependents, setDependents] = useState<number>(0);

  const [hasCI, setHasCI] = useState<boolean>(false);
  const [hasDisability, setHasDisability] = useState<boolean>(false);
  const [hasLife, setHasLife] = useState<boolean>(false);

  const parsed = useMemo(() => {
    const essentials = Number(monthlyEssentials || 0);
    const savings = Number(liquidSavings || 0);
    return {
      essentials: Number.isFinite(essentials) ? essentials : 0,
      savings: Number.isFinite(savings) ? savings : 0,
    };
  }, [monthlyEssentials, liquidSavings]);

  const result: Result | null = useMemo(() => {
    const essentials = parsed.essentials;
    const savings = parsed.savings;

    if (essentials <= 0 || savings < 0) return null;

    const bufferMonthsRaw = savings / essentials;
    const bufferMonths = round2(bufferMonthsRaw);
    const bufferScore = bufferScoreFromMonths(bufferMonthsRaw);

    const shockNeed = essentials * 6 * 0.5;
    const shockGap = Math.max(shockNeed - savings, 0);

    const coverageAwareness =
      (hasCI ? 1 : 0) + (hasDisability ? 1 : 0) + (hasLife ? 1 : 0);

    const awarenessScore = clamp((coverageAwareness / 3) * 100, 0, 100);

    let dependentPenalty = 0;
    if (dependents >= 1 && !hasLife) dependentPenalty = 12;
    if (dependents >= 2 && !hasLife) dependentPenalty = 18;
    if (dependents >= 3 && !hasLife) dependentPenalty = 22;

    const shockScore = clamp(100 - (shockGap / (shockNeed || 1)) * 100, 0, 100);

    const rawOverall =
      bufferScore * 0.45 +
      shockScore * 0.35 +
      awarenessScore * 0.2 -
      dependentPenalty;

    const overallScore = clamp(Math.round(rawOverall), 0, 100);

    let level: Result["level"] = "Moderate";
    if (overallScore < 40) level = "Low";
    if (overallScore >= 70) level = "Strong";

    return {
      bufferMonths,
      bufferScore,
      shockNeed,
      shockGap,
      dependents,
      overallScore,
      level,
    };
  }, [parsed, dependents, hasCI, hasDisability, hasLife]);

  const summaryText = useMemo(() => {
    if (!result) return "";
    return `Resilience Score ${result.overallScore}/100 • Buffer ${result.bufferMonths} months • 6-month shock gap $${formatMoney(result.shockGap)}`;
  }, [result]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
          ← Back to tools
        </a>
        <h1 className="text-3xl font-bold">Resilience Score</h1>
        <p className="text-[var(--cs-muted)]">
          Educational self-check. It highlights potential pressure points — not a recommendation.
        </p>
      </div>

      <div className="cs-card p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Monthly essentials (SGD)</div>
            <input
              inputMode="numeric"
              value={monthlyEssentials}
              onChange={(e) => setMonthlyEssentials(e.target.value.replace(/[^\d.]/g, ""))}
              className="cs-input"
              placeholder="e.g. 2000"
            />
            <div className="text-xs text-[var(--cs-muted)]">
              Think: food, transport, bills, minimum commitments.
            </div>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Liquid savings (SGD)</div>
            <input
              inputMode="numeric"
              value={liquidSavings}
              onChange={(e) => setLiquidSavings(e.target.value.replace(/[^\d.]/g, ""))}
              className="cs-input"
              placeholder="e.g. 8000"
            />
            <div className="text-xs text-[var(--cs-muted)]">
              Cash/bank funds you can access quickly (not locked investments).
            </div>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Dependents count</div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDependents(n)}
                  className={`cs-btn cs-btn-ghost ${dependents === n ? "cs-btn-primary" : ""}`}
                >
                  {n === 3 ? "3+" : n}
                </button>
              ))}
            </div>
            <div className="text-xs text-[var(--cs-muted)]">
              Anyone relying on your income (parents/partner/children).
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Existing protection (optional)</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHasLife((v) => !v)}
                className={`cs-btn ${hasLife ? "cs-btn-primary" : "cs-btn-ghost"}`}
              >
                Life/Death cover
              </button>
              <button
                type="button"
                onClick={() => setHasCI((v) => !v)}
                className={`cs-btn ${hasCI ? "cs-btn-primary" : "cs-btn-ghost"}`}
              >
                Critical illness
              </button>
              <button
                type="button"
                onClick={() => setHasDisability((v) => !v)}
                className={`cs-btn ${hasDisability ? "cs-btn-primary" : "cs-btn-ghost"}`}
              >
                Disability / income protection
              </button>
            </div>
            <div className="text-xs text-[var(--cs-muted)]">
              Just a yes/no check. No product names, no comparisons.
            </div>
          </div>
        </div>
      </div>

      <div className="cs-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Your snapshot</h2>
          {result && (
            <span className={levelBadgeClass(result.level)}>{levelLabel(result.level)}</span>
          )}
        </div>

        {!result ? (
          <div className="text-sm text-[var(--cs-muted)]">
            Enter your monthly essentials and liquid savings to see results.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <div className="text-sm text-[var(--cs-muted)]">Resilience Score</div>
                <div className="text-4xl font-bold">{result.overallScore}/100</div>
                <div className="text-sm mt-2">
                  <span className="mr-2 text-[var(--cs-muted)]">Level:</span>
                  <span className={levelBadgeClass(result.level)}>{levelLabel(result.level)}</span>
                </div>
              </div>

              <div className="text-sm text-[var(--cs-muted)] sm:text-right">
                <div>
                  Buffer:{" "}
                  <span className="font-semibold text-[var(--cs-text)]">
                    {result.bufferMonths} months
                  </span>
                </div>
                <div className="mt-1">
                  6-month shock gap:{" "}
                  <span className="font-semibold text-[var(--cs-text)]">
                    ${formatMoney(result.shockGap)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-[var(--cs-text)] leading-relaxed space-y-2">
              <div className="font-semibold">What this means (educational)</div>
              <ul className="list-disc pl-5 space-y-1 text-[var(--cs-muted)]">
                <li>Buffer months estimates how long your liquid savings can cover essentials.</li>
                <li>Shock gap simulates a 6-month period where income drops by 50%.</li>
                <li>If you have dependents, lacking protection can increase family impact risk.</li>
              </ul>
            </div>

            <div className="cs-card p-5">
              <div className="font-semibold">Want a personalised review?</div>
              <div className="text-[var(--cs-muted)] mt-1">
                This is based on assumptions and may not reflect your full situation.
                If you’d like, request a chat and I’ll reach out.
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/contact?tool=resilience&summary=${encodeURIComponent(summaryText)}`}
                  className="cs-btn cs-btn-primary"
                >
                  Request a chat
                </a>
                <a href="/tools" className="cs-btn cs-btn-ghost">
                  Back to tools
                </a>
              </div>
            </div>

            <div className="text-xs text-[var(--cs-muted)]">
              Disclaimer: General information only. Not financial advice or a product recommendation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

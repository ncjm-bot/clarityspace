"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";

type Gender = "male" | "female" | "unspecified";

type MoneyMode = "monthly" | "annual";

type Outputs = {
  annualCommitments: number;
  yearsToSupport: number;

  deathNeed: number;
  tpdNeed: number;
  ciNeed: number;

  deathGap: number;
  tpdGap: number;
  ciGap: number;
  totalGap: number;

  exDeath: number;
  exTPD: number;
  exCI: number;

  riskLabel: "LOW" | "MODERATE" | "RISK";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toNumberSafe(v: string) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number) {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("en-SG");
}

function riskFromTotalGap(totalGap: number, annualCommitments: number) {
  const annual = Math.max(1, annualCommitments);
  const ratio = totalGap / annual;
  if (ratio <= 8) return "LOW";
  if (ratio <= 20) return "MODERATE";
  return "RISK";
}

function badgeClass(risk: Outputs["riskLabel"]) {
  if (risk === "LOW") return "cs-badge cs-badge-good";
  if (risk === "MODERATE") return "cs-badge cs-badge-warn";
  return "cs-badge cs-badge-risk";
}

function softRiskTone(risk: Outputs["riskLabel"]) {
  if (risk === "LOW") return "text-emerald-700";
  if (risk === "MODERATE") return "text-amber-700";
  return "text-rose-700";
}

function stripNonNumeric(s: string) {
  return s.replace(/[^\d.]/g, "");
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const SG_LE_AT_BIRTH_2024 = {
  male: 81.2,
  female: 85.6,
  overall: 83.5,
};

const SOURCES = {
  singstatLifeTables:
    "https://www.singstat.gov.sg/-/media/files/publications/population/lifetable23-24.ashx",
  moneysenseBfpg: "https://www.moneysense.gov.sg/planning-your-finances-well/",
};

type StepKey = "profile" | "needs" | "existing" | "results";

export default function ProtectionGapTool() {
  const [step, setStep] = useState<StepKey>("profile");

  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [dependents, setDependents] = useState<number>(0);

  const [commitmentsInput, setCommitmentsInput] = useState<string>("");
  const [yearsToSupport, setYearsToSupport] = useState<string>("20");

  const [oneTimeCosts, setOneTimeCosts] = useState<string>("");
  const [debtsToClear, setDebtsToClear] = useState<string>("");

  const [incomeReplacePct, setIncomeReplacePct] = useState<number>(60);
  const [tpdYearsCover, setTpdYearsCover] = useState<number>(10);

  const [ciMonthsCover, setCiMonthsCover] = useState<number>(24);
  const [ciOneOffBuffer, setCiOneOffBuffer] = useState<string>("20000");

  const [existingDeath, setExistingDeath] = useState<string>("");
  const [existingTPD, setExistingTPD] = useState<string>("");
  const [existingCI, setExistingCI] = useState<string>("");

  const [showBenchmarks, setShowBenchmarks] = useState<boolean>(true);

  const lifeExpectancyHint = useMemo(() => {
    const a = toNumberSafe(age);
    if (a <= 0) return null;

    if (gender === "male") return SG_LE_AT_BIRTH_2024.male;
    if (gender === "female") return SG_LE_AT_BIRTH_2024.female;
    return SG_LE_AT_BIRTH_2024.overall;
  }, [age, gender]);

  const yearsRemainingHint = useMemo(() => {
    const a = toNumberSafe(age);
    if (!lifeExpectancyHint || a <= 0) return null;
    return clamp(round1(lifeExpectancyHint - a), 0, 70);
  }, [age, lifeExpectancyHint]);

  const annualCommitments = useMemo(() => {
    const v = toNumberSafe(commitmentsInput);
    if (moneyMode === "annual") return Math.max(0, v);
    return Math.max(0, v * 12);
  }, [commitmentsInput, moneyMode]);

  const parsedYears = useMemo(() => {
    const y = toNumberSafe(yearsToSupport);
    return Math.max(0, y);
  }, [yearsToSupport]);

  const outputs: Outputs | null = useMemo(() => {
    if (annualCommitments <= 0 || parsedYears <= 0) return null;

    const otc = Math.max(0, toNumberSafe(oneTimeCosts));
    const debts = Math.max(0, toNumberSafe(debtsToClear));
    const ciBuffer = Math.max(0, toNumberSafe(ciOneOffBuffer));

    const exDeath = Math.max(0, toNumberSafe(existingDeath));
    const exTPD = Math.max(0, toNumberSafe(existingTPD));
    const exCI = Math.max(0, toNumberSafe(existingCI));

    const deathNeed = annualCommitments * parsedYears + otc + debts;

    const tpdNeed =
      annualCommitments * Math.max(0, tpdYearsCover) * (clamp(incomeReplacePct, 0, 100) / 100);

    const ciNeed =
      (annualCommitments / 12) * Math.max(0, ciMonthsCover) + ciBuffer;

    const deathGap = Math.max(deathNeed - exDeath, 0);
    const tpdGap = Math.max(tpdNeed - exTPD, 0);
    const ciGap = Math.max(ciNeed - exCI, 0);

    const totalGap = deathGap + tpdGap + ciGap;

    return {
      annualCommitments,
      yearsToSupport: parsedYears,

      deathNeed,
      tpdNeed,
      ciNeed,

      deathGap,
      tpdGap,
      ciGap,
      totalGap,

      exDeath,
      exTPD,
      exCI,

      riskLabel: riskFromTotalGap(totalGap, annualCommitments),
    };
  }, [
    annualCommitments,
    parsedYears,
    oneTimeCosts,
    debtsToClear,
    incomeReplacePct,
    tpdYearsCover,
    ciMonthsCover,
    ciOneOffBuffer,
    existingDeath,
    existingTPD,
    existingCI,
  ]);

  const canGoNeeds = useMemo(() => {
    return toNumberSafe(age) > 0 && annualCommitments >= 0;
  }, [age, annualCommitments]);

  const canGoExisting = useMemo(() => {
    return annualCommitments > 0 && parsedYears > 0;
  }, [annualCommitments, parsedYears]);

  const canGoResults = useMemo(() => {
    return Boolean(outputs);
  }, [outputs]);

  useEffect(() => {
    if (step === "existing" && !canGoExisting) setStep("needs");
    if (step === "results" && !canGoResults) setStep("existing");
  }, [step, canGoExisting, canGoResults]);

  const progress = useMemo(() => {
    const idx = ["profile", "needs", "existing", "results"].indexOf(step);
    return clamp(((idx + 1) / 4) * 100, 0, 100);
  }, [step]);

  const summaryText = useMemo(() => {
    if (!outputs) return "";
    return [
      `Protection Gap Check`,
      `Annual commitments $${formatMoney(outputs.annualCommitments)}`,
      `Death gap $${formatMoney(outputs.deathGap)}`,
      `TPD gap $${formatMoney(outputs.tpdGap)}`,
      `CI gap $${formatMoney(outputs.ciGap)}`,
      `Total gap $${formatMoney(outputs.totalGap)}`,
      `Risk ${outputs.riskLabel}`,
    ].join(" • ");
  }, [outputs]);

  const titleLine = useMemo(() => {
    if (!outputs) return "Protection Gap Check";
    return `Protection Gap Check • ${outputs.riskLabel}`;
  }, [outputs]);

  const topHint = useMemo(() => {
    if (!outputs) return "Enter your basics — we’ll turn it into a simple, educational snapshot.";
    if (outputs.riskLabel === "LOW") return "Nice. Looks relatively covered based on what you keyed in.";
    if (outputs.riskLabel === "MODERATE") return "Some gaps show up. Worth a quick review to sanity-check.";
    return "Big gaps detected. Don’t panic — use this as a starting point for a proper review.";
  }, [outputs]);

  const benchmark = useMemo(() => {
    if (!outputs) return null;
    const annual = outputs.annualCommitments;
    return {
      deathTpdThumb: annual * 9,
      ciThumb: annual * 4,
      premiumRule: "15% of income",
    };
  }, [outputs]);

  const chartMax = useMemo(() => {
    if (!outputs) return 1;
    return Math.max(outputs.deathNeed, outputs.tpdNeed, outputs.ciNeed, 1);
  }, [outputs]);

  function goNext() {
    if (step === "profile") setStep("needs");
    else if (step === "needs") setStep("existing");
    else if (step === "existing") setStep("results");
  }

  function goBack() {
    if (step === "results") setStep("existing");
    else if (step === "existing") setStep("needs");
    else if (step === "needs") setStep("profile");
  }

  const StepPill = (props: { k: StepKey; label: string; sub?: string }) => {
    const active = step === props.k;
    const done =
      ["profile", "needs", "existing", "results"].indexOf(props.k) <
      ["profile", "needs", "existing", "results"].indexOf(step);

    return (
      <button
        type="button"
        onClick={() => {
          if (props.k === "profile") return setStep("profile");
          if (props.k === "needs") return setStep(canGoNeeds ? "needs" : "profile");
          if (props.k === "existing") return setStep(canGoExisting ? "existing" : "needs");
          if (props.k === "results") return setStep(canGoResults ? "results" : "existing");
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
            {props.sub ? (
              <div className="text-xs text-[var(--cs-muted)] mt-0.5">{props.sub}</div>
            ) : null}
          </div>
          <div
            className={[
              "h-8 w-8 rounded-xl flex items-center justify-center",
              active
                ? "bg-[var(--cs-card)]"
                : done
                  ? "bg-emerald-50"
                  : "bg-white/60",
            ].join(" ")}
            aria-hidden="true"
          >
            {done ? "✓" : active ? "●" : "○"}
          </div>
        </div>
      </button>
    );
  };

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
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-[rgba(108,92,231,0.18)] blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[rgba(0,184,148,0.16)] blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge">Educational self-check</span>
                <span className="cs-badge">No product names</span>
                <span className="cs-badge">No comparisons</span>
              </div>
              <div className="flex items-end gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold">{titleLine}</h1>
                {outputs ? <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span> : null}
              </div>
              <p className="text-[var(--cs-muted)] max-w-2xl">
                {topHint} This is not advice — it’s a quick “do I have a gap?” check.
              </p>
            </div>

            <div className="lg:w-[360px]">
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
                  <div className="text-xs text-[var(--cs-muted)]">Input mode</div>
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
                  Tip: Keep it simple. If you’re unsure, key in a rough number first — refine later.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StepPill k="profile" label="Profile" sub="Tone + helpful defaults" />
            <StepPill k="needs" label="Needs" sub="What you want to protect" />
            <StepPill k="existing" label="Existing cover" sub="What you already have" />
            <StepPill k="results" label="Results" sub="Clear gaps + visuals" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "profile" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Profile</div>
                  <div className="text-sm text-[var(--cs-muted)]">
                    Just enough to keep the tool human-friendly. Calculations stay educational.
                  </div>
                </div>

                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-[color:var(--cs-card)/0.9] border border-[var(--cs-border)] flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 21s-7-4.35-9.33-9.07C.66 7.64 3.02 4.5 6.5 4.5c1.74 0 3.22.8 4.1 2.02C11.28 5.3 12.76 4.5 14.5 4.5c3.48 0 5.84 3.14 3.83 7.43C19 16.65 12 21 12 21z"
                        stroke="rgba(36,20,48,0.75)"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M8.5 12h2l1-2.2 1.2 4.2 1.1-2h1.7"
                        stroke="rgba(108,92,231,0.9)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="absolute -inset-2 rounded-[22px] border border-[rgba(108,92,231,0.18)] animate-pulse" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Age</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={age}
                    onChange={(e) => setAge(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 25"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Used only for optional “life expectancy” hint.
                  </div>
                </label>

                <div className="space-y-1">
                  <div className="text-sm font-semibold">Gender</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={[
                        "cs-btn w-full",
                        gender === "male" ? "cs-btn-primary" : "cs-btn-ghost",
                      ].join(" ")}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={[
                        "cs-btn w-full",
                        gender === "female" ? "cs-btn-primary" : "cs-btn-ghost",
                      ].join(" ")}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("unspecified")}
                      className={[
                        "cs-btn w-full",
                        gender === "unspecified" ? "cs-btn-primary" : "cs-btn-ghost",
                      ].join(" ")}
                    >
                      Skip
                    </button>
                  </div>
                  {lifeExpectancyHint ? (
                    <div className="text-xs text-[var(--cs-muted)]">
                      Singapore average life expectancy at birth:{" "}
                      <span className="font-semibold text-[var(--cs-text)]">{lifeExpectancyHint}</span>{" "}
                      (2024 residents).{" "}
                      <a className="underline" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                        Source
                      </a>
                      {yearsRemainingHint !== null ? (
                        <>
                          {" "}
                          • Rough remaining years:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">{yearsRemainingHint}</span>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--cs-muted)]">
                      Optional hint uses SingStat life tables (not a personal prediction).
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold">Dependents</div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDependents(n)}
                        className={[
                          "cs-btn w-full",
                          dependents === n ? "cs-btn-primary" : "cs-btn-ghost",
                        ].join(" ")}
                      >
                        {n === 3 ? "3+" : String(n)}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--cs-muted)]">
                    Anyone relying on your income (parents / partner / kids).
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-4">
                <div className="text-sm font-semibold">Mini explainer (plain English)</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-[var(--cs-muted)] space-y-1">
                  <li><span className="font-semibold text-[var(--cs-text)]">Death</span>: money your family may need if you’re gone.</li>
                  <li><span className="font-semibold text-[var(--cs-text)]">TPD</span>: disability scenario — replaces income partially.</li>
                  <li><span className="font-semibold text-[var(--cs-text)]">Critical Illness</span>: cash buffer for treatment + time off work.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  className="cs-btn cs-btn-primary"
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "needs" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Your needs</div>
                  <div className="text-sm text-[var(--cs-muted)]">
                    Key in what you want to cover. Keep it rough — this is educational.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="cs-btn cs-btn-ghost"
                    onClick={() => setShowBenchmarks((v) => !v)}
                  >
                    {showBenchmarks ? "Hide benchmarks" : "Show benchmarks"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">
                    {moneyMode === "monthly" ? "Commitments (SGD / month)" : "Commitments (SGD / year)"}
                  </div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={commitmentsInput}
                    onChange={(e) => setCommitmentsInput(stripNonNumeric(e.target.value))}
                    placeholder={moneyMode === "monthly" ? "e.g. 3000" : "e.g. 36000"}
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Think: essentials + bills + allowance + education/loan commitments.
                  </div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Years to provide for (Death)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={yearsToSupport}
                    onChange={(e) => setYearsToSupport(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 20"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    How long you want that support to last.
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
                    onChange={(e) => setOneTimeCosts(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 30000"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Funeral / final expenses / immediate family cash buffer.
                  </div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Debts to clear (optional)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={debtsToClear}
                    onChange={(e) => setDebtsToClear(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 120000"
                  />
                  <div className="text-xs text-[var(--cs-muted)]">
                    Example: outstanding loans you prefer your family not to carry.
                  </div>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white/75 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">TPD (disability) assumptions</div>
                    <span className="cs-badge">Adjustable</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold">
                      Replace income: {incomeReplacePct}%
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
                      Educational only. Real needs depend on earning years, lifestyle, and support.
                    </div>

                    <div className="mt-4 text-sm font-semibold">
                      Cover for: {tpdYearsCover} years
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={Math.max(5, Math.min(40, yearsRemainingHint ? Math.round(yearsRemainingHint) : 30))}
                      value={tpdYearsCover}
                      onChange={(e) => setTpdYearsCover(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-[var(--cs-muted)]">
                      If you’re unsure: 5–10 years is a common “starter” assumption.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--cs-border)] bg-white/75 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Critical Illness assumptions</div>
                    <span className="cs-badge">Adjustable</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold">
                      Income pause: {ciMonthsCover} months
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
                      A simple “time off work” view, not a medical estimate.
                    </div>

                    <label className="space-y-1 mt-4 block">
                      <div className="text-sm font-semibold">One-off buffer (optional)</div>
                      <input
                        inputMode="numeric"
                        className="cs-input"
                        value={ciOneOffBuffer}
                        onChange={(e) => setCiOneOffBuffer(stripNonNumeric(e.target.value))}
                        placeholder="e.g. 20000"
                      />
                      <div className="text-xs text-[var(--cs-muted)]">
                        For transport, caregiver costs, supplements, misc out-of-pocket.
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {showBenchmarks ? (
                <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">Benchmarks (Singapore “rules of thumb”)</div>
                      <div className="text-sm text-[var(--cs-muted)]">
                        Optional reference only — your situation can be different.
                      </div>
                    </div>
                    <a className="cs-btn cs-btn-ghost" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                      View source
                    </a>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/80 border border-[var(--cs-border)] p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Death & TPD (thumb rule)</div>
                      <div className="text-lg font-bold">9× annual income</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">MoneySense basic planning guide.</div>
                    </div>
                    <div className="rounded-2xl bg-white/80 border border-[var(--cs-border)] p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Critical illness (thumb rule)</div>
                      <div className="text-lg font-bold">4× annual income</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">MoneySense basic planning guide.</div>
                    </div>
                    <div className="rounded-2xl bg-white/80 border border-[var(--cs-border)] p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Spend guideline</div>
                      <div className="text-lg font-bold">Up to 15%</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Of income on insurance protection.</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                  Back
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn-primary"
                  onClick={goNext}
                  disabled={!canGoExisting}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {step === "existing" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="space-y-1">
                <div className="text-lg font-bold">Your existing cover</div>
                <div className="text-sm text-[var(--cs-muted)]">
                  Optional — but the more accurate this is, the better the gap snapshot.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Death (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={existingDeath}
                    onChange={(e) => setExistingDeath(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 500000"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">TPD (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={existingTPD}
                    onChange={(e) => setExistingTPD(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 500000"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Critical Illness (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={existingCI}
                    onChange={(e) => setExistingCI(stripNonNumeric(e.target.value))}
                    placeholder="e.g. 200000"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                <div className="text-sm font-semibold">Quick tips (to avoid confusion)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="cs-badge">Use total coverage amount</span>
                  <span className="cs-badge">Include all companies</span>
                  <span className="cs-badge">If unsure, key in rough</span>
                </div>
                <div className="mt-3 text-sm text-[var(--cs-muted)]">
                  If you’re not sure, you can leave blank and still see a “needs” number.
                  The tool will treat blank as $0 coverage.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                  Back
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn-primary"
                  onClick={goNext}
                  disabled={!canGoResults}
                >
                  Show results
                </button>
              </div>
            </div>
          ) : null}

          {step === "results" ? (
            <div className="cs-card p-6 sm:p-7 rounded-[26px] space-y-6">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Results</div>
                  <div className="text-sm text-[var(--cs-muted)]">
                    A simple “coverage vs gap” view. Not advice, not a recommendation.
                  </div>
                </div>

                {outputs ? (
                  <div className="flex items-center gap-2">
                    <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span>
                    <span className={["text-sm font-semibold", softRiskTone(outputs.riskLabel)].join(" ")}>
                      Total gap ${formatMoney(outputs.totalGap)}
                    </span>
                  </div>
                ) : null}
              </div>

              {!outputs ? (
                <div className="text-sm text-[var(--cs-muted)]">
                  Please complete your inputs first.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <ResultCard
                      title="Death"
                      subtitle="Family support + one-time needs"
                      need={outputs.deathNeed}
                      existing={outputs.exDeath}
                      max={chartMax}
                      accent="purple"
                    />
                    <ResultCard
                      title="TPD"
                      subtitle="Income replacement (partial)"
                      need={outputs.tpdNeed}
                      existing={outputs.exTPD}
                      max={chartMax}
                      accent="teal"
                    />
                    <ResultCard
                      title="Critical Illness"
                      subtitle="Time off work + buffer"
                      need={outputs.ciNeed}
                      existing={outputs.exCI}
                      max={chartMax}
                      accent="rose"
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-5">
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div>
                        <div className="text-sm font-semibold">What you keyed in</div>
                        <div className="text-sm text-[var(--cs-muted)] mt-1">
                          Annual commitments:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">
                            ${formatMoney(outputs.annualCommitments)}
                          </span>{" "}
                          • Death years:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">
                            {outputs.yearsToSupport}
                          </span>{" "}
                          • TPD:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">
                            {incomeReplacePct}% × {tpdYearsCover}y
                          </span>{" "}
                          • CI:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">
                            {ciMonthsCover} months
                          </span>
                        </div>

                        {benchmark ? (
                          <div className="text-xs text-[var(--cs-muted)] mt-3 leading-relaxed">
                            Optional benchmark (MoneySense): Death/TPD about{" "}
                            <span className="font-semibold text-[var(--cs-text)]">
                              ${formatMoney(benchmark.deathTpdThumb)}
                            </span>{" "}
                            (9× annual income), CI about{" "}
                            <span className="font-semibold text-[var(--cs-text)]">
                              ${formatMoney(benchmark.ciThumb)}
                            </span>{" "}
                            (4× annual income).{" "}
                            <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                              Source
                            </a>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          className="cs-btn cs-btn-primary"
                          href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}
                        >
                          Request a chat
                        </a>
                        <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("needs")}>
                          Adjust inputs
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-5">
                    <div className="text-sm font-semibold">If you want it even clearer</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="cs-badge">Start with commitments + years</span>
                      <span className="cs-badge">Then refine CI months</span>
                      <span className="cs-badge">Add debts if relevant</span>
                      <span className="cs-badge">Update existing cover later</span>
                    </div>
                    <div className="mt-3 text-xs text-[var(--cs-muted)] leading-relaxed">
                      Disclaimer: General information only. Not financial advice and not a product recommendation.
                      This tool doesn’t account for medical inflation, CPF, liabilities detail, underwriting, or policy terms.
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
          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Live mini-summary</div>
            <div className="text-xs text-[var(--cs-muted)] mt-1">
              Updates as you type — helps you stay oriented.
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <SummaryRow
                label="Mode"
                value={moneyMode === "monthly" ? "Monthly input" : "Annual input"}
              />
              <SummaryRow
                label="Annual commitments"
                value={annualCommitments > 0 ? `$${formatMoney(annualCommitments)}` : "—"}
              />
              <SummaryRow
                label="Death years"
                value={parsedYears > 0 ? `${parsedYears} years` : "—"}
              />
              <SummaryRow
                label="TPD"
                value={`${incomeReplacePct}% × ${tpdYearsCover}y`}
              />
              <SummaryRow
                label="CI"
                value={`${ciMonthsCover} months`}
              />
              <SummaryRow
                label="Dependents"
                value={dependents === 3 ? "3+" : String(dependents)}
              />
            </div>

            {outputs ? (
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Total gap</div>
                  <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span>
                </div>
                <div className="mt-1 text-2xl font-bold">${formatMoney(outputs.totalGap)}</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Educational estimate from your inputs.
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--cs-muted)]">
                Enter commitments + years to generate results.
              </div>
            )}
          </div>

          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Make it beginner-friendly</div>
            <div className="text-xs text-[var(--cs-muted)] mt-1">
              If you’re helping someone new, try this order:
            </div>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
              <li>Start with commitments + years</li>
              <li>Set CI months (e.g. 12–24) as a starting point</li>
              <li>Only then fill existing cover</li>
              <li>Request a chat if you want a personalised walkthrough</li>
            </ol>
          </div>

          <div className="cs-card p-5 rounded-[22px]">
            <div className="text-sm font-semibold">Sources used (for trust)</div>
            <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
              Life expectancy hint: Singapore Department of Statistics life tables (2023–2024).{" "}
              <a className="underline" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                View
              </a>
              <br />
              Benchmarks: MoneySense basic financial planning guide (9× annual income for Death/TPD, 4× for CI, up to 15% guideline).{" "}
              <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                View
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[var(--cs-muted)]">{props.label}</div>
      <div className="font-semibold text-[var(--cs-text)]">{props.value}</div>
    </div>
  );
}

function ResultCard(props: {
  title: string;
  subtitle: string;
  need: number;
  existing: number;
  max: number;
  accent: "purple" | "teal" | "rose";
}) {
  const need = Math.max(0, props.need);
  const existing = clamp(Math.max(0, props.existing), 0, need);
  const gap = Math.max(need - existing, 0);

  const pctNeed = clamp((need / Math.max(props.max, 1)) * 100, 0, 100);
  const pctExisting = need <= 0 ? 0 : clamp((existing / need) * 100, 0, 100);

  const accentBg =
    props.accent === "purple"
      ? "bg-[rgba(108,92,231,0.12)]"
      : props.accent === "teal"
        ? "bg-[rgba(0,184,148,0.12)]"
        : "bg-[rgba(232,67,147,0.10)]";

  const accentStroke =
    props.accent === "purple"
      ? "rgba(108,92,231,0.28)"
      : props.accent === "teal"
        ? "rgba(0,184,148,0.28)"
        : "rgba(232,67,147,0.26)";

  return (
    <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/85 backdrop-blur p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{props.title}</div>
          <div className="text-xs text-[var(--cs-muted)] mt-0.5">{props.subtitle}</div>
        </div>
        <div className={["h-9 w-9 rounded-2xl border flex items-center justify-center", accentBg].join(" ")} style={{ borderColor: accentStroke }}>
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: accentStroke }} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--cs-muted)]">Need</div>
            <div className="text-lg font-bold">${formatMoney(need)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--cs-muted)]">Gap</div>
            <div className={["text-lg font-bold", gap > 0 ? "text-rose-700" : "text-emerald-700"].join(" ")}>
              ${formatMoney(gap)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-3 rounded-full bg-[color:var(--cs-card)/0.8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[rgba(36,20,48,0.10)]"
              style={{ width: `${pctNeed}%` }}
            >
              <div className="h-full rounded-full bg-[rgba(0,184,148,0.35)]" style={{ width: `${pctExisting}%` }} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
            <span>Coverage</span>
            <span>Gap</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-3">
              <div className="text-[10px] text-[var(--cs-muted)]">Existing</div>
              <div className="text-sm font-semibold">${formatMoney(existing)}</div>
            </div>
            <div className="rounded-xl border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.45] p-3">
              <div className="text-[10px] text-[var(--cs-muted)]">Shortfall</div>
              <div className="text-sm font-semibold">${formatMoney(gap)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

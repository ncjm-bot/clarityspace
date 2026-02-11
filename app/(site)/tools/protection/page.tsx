"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type Gender = "male" | "female" | "unspecified";
type MoneyMode = "monthly" | "annual";
type StepKey = "profile" | "needs" | "existing" | "results";

type Outputs = {
  annualEssentials: number;
  supportYears: number;

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

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function stripToDigits(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

function parseMoney(v: string) {
  const n = Number(stripToDigits(v));
  return Number.isFinite(n) ? n : 0;
}

function formatMoneySGD(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("en-SG");
}

function formatMoney(n: number) {
  return formatMoneySGD(n);
}

function riskFromProfile(totalGap: number, annualEssentials: number, dependents: number) {
  const base = totalGap / Math.max(1, annualEssentials);
  const depBoost = dependents >= 2 ? 1.25 : dependents === 1 ? 1.12 : 1;
  const score = base * depBoost;

  if (score <= 6) return "LOW";
  if (score <= 14) return "MODERATE";
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

const STEP_ORDER: StepKey[] = ["profile", "needs", "existing", "results"];

export default function ProtectionGapTool() {
  const [step, setStep] = useState<StepKey>("profile");

  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [ageRaw, setAgeRaw] = useState<string>("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [dependents, setDependents] = useState<number>(0);

  const [essentialsRaw, setEssentialsRaw] = useState<string>("");
  const [supportYearsRaw, setSupportYearsRaw] = useState<string>("");

  const [cashBufferRaw, setCashBufferRaw] = useState<string>("");
  const [debtsRaw, setDebtsRaw] = useState<string>("");

  const [replaceEssentialsPct, setReplaceEssentialsPct] = useState<number>(60);
  const [tpdYearsCover, setTpdYearsCover] = useState<number>(10);

  const [ciMonthsOff, setCiMonthsOff] = useState<number>(24);
  const [ciExtraBufferRaw, setCiExtraBufferRaw] = useState<string>("20000");

  const [existingDeathRaw, setExistingDeathRaw] = useState<string>("");
  const [existingTPDRaw, setExistingTPDRaw] = useState<string>("");
  const [existingCIRaw, setExistingCIRaw] = useState<string>("");

  const [showBenchmarks, setShowBenchmarks] = useState<boolean>(true);

  const age = useMemo(() => Number(stripToDigits(ageRaw || "0")) || 0, [ageRaw]);

  const lifeExpectancyHint = useMemo(() => {
    if (age <= 0) return null;
    if (gender === "male") return SG_LE_AT_BIRTH_2024.male;
    if (gender === "female") return SG_LE_AT_BIRTH_2024.female;
    return SG_LE_AT_BIRTH_2024.overall;
  }, [age, gender]);

  const yearsRemainingHint = useMemo(() => {
    if (!lifeExpectancyHint || age <= 0) return null;
    return clamp(round1(lifeExpectancyHint - age), 0, 70);
  }, [age, lifeExpectancyHint]);

  const suggestedSupportYears = useMemo(() => {
    if (dependents >= 1) return 20;
    return 15;
  }, [dependents]);

  useEffect(() => {
    if (!supportYearsRaw.trim()) setSupportYearsRaw(String(suggestedSupportYears));
  }, [suggestedSupportYears, supportYearsRaw]);

  const annualEssentials = useMemo(() => {
    const v = parseMoney(essentialsRaw);
    if (moneyMode === "annual") return Math.max(0, v);
    return Math.max(0, v * 12);
  }, [essentialsRaw, moneyMode]);

  const supportYears = useMemo(() => {
    const y = Number(stripToDigits(supportYearsRaw || "0")) || 0;
    return Math.max(0, y);
  }, [supportYearsRaw]);

  const outputs: Outputs | null = useMemo(() => {
    if (annualEssentials <= 0 || supportYears <= 0) return null;

    const cashBuffer = Math.max(0, parseMoney(cashBufferRaw));
    const debts = Math.max(0, parseMoney(debtsRaw));
    const ciExtra = Math.max(0, parseMoney(ciExtraBufferRaw));

    const exDeath = Math.max(0, parseMoney(existingDeathRaw));
    const exTPD = Math.max(0, parseMoney(existingTPDRaw));
    const exCI = Math.max(0, parseMoney(existingCIRaw));

    const deathNeed = annualEssentials * supportYears + cashBuffer + debts;

    const tpdNeed =
      annualEssentials *
      Math.max(0, tpdYearsCover) *
      (clamp(replaceEssentialsPct, 0, 100) / 100);

    const ciNeed = (annualEssentials / 12) * Math.max(0, ciMonthsOff) + ciExtra;

    const deathGap = Math.max(deathNeed - exDeath, 0);
    const tpdGap = Math.max(tpdNeed - exTPD, 0);
    const ciGap = Math.max(ciNeed - exCI, 0);

    const totalGap = deathGap + tpdGap + ciGap;

    return {
      annualEssentials,
      supportYears,

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

      riskLabel: riskFromProfile(totalGap, annualEssentials, dependents),
    };
  }, [
    annualEssentials,
    supportYears,
    cashBufferRaw,
    debtsRaw,
    replaceEssentialsPct,
    tpdYearsCover,
    ciMonthsOff,
    ciExtraBufferRaw,
    existingDeathRaw,
    existingTPDRaw,
    existingCIRaw,
    dependents,
  ]);

  const canGoNeeds = useMemo(() => age > 0, [age]);
  const canGoExisting = useMemo(
    () => annualEssentials > 0 && supportYears > 0,
    [annualEssentials, supportYears]
  );
  const canGoResults = useMemo(() => Boolean(outputs), [outputs]);

  useEffect(() => {
    if (step === "needs" && !canGoNeeds) setStep("profile");
    if (step === "existing" && !canGoExisting) setStep("needs");
    if (step === "results" && !canGoResults) setStep("existing");
  }, [step, canGoNeeds, canGoExisting, canGoResults]);

  const progress = useMemo(() => {
    const idx = STEP_ORDER.indexOf(step);
    return clamp(((idx + 1) / STEP_ORDER.length) * 100, 0, 100);
  }, [step]);

  const titleLine = useMemo(() => {
    if (!outputs) return "Protection Gap Check";
    return `Protection Gap Check • ${outputs.riskLabel}`;
  }, [outputs]);

  const topHint = useMemo(() => {
    if (!outputs) return "Key in a few basics — you’ll get a clean, educational snapshot (not advice).";
    if (outputs.riskLabel === "LOW") return "Looks reasonably covered for the assumptions used.";
    if (outputs.riskLabel === "MODERATE") return "Some gaps show up — usually worth tightening the basics.";
    return "Large gaps detected — treat this as a starting point for a proper review.";
  }, [outputs]);

  const benchmark = useMemo(() => {
    if (!outputs) return null;
    const annual = outputs.annualEssentials;
    return {
      deathTpdThumb: annual * 9,
      ciThumb: annual * 4,
      premiumRule: "15% of income",
    };
  }, [outputs]);

  const summaryText = useMemo(() => {
    if (!outputs) return "";
    return [
      `Protection Gap Check`,
      `Annual essentials $${formatMoney(outputs.annualEssentials)}`,
      `Death shortfall $${formatMoney(outputs.deathGap)}`,
      `TPD shortfall $${formatMoney(outputs.tpdGap)}`,
      `CI shortfall $${formatMoney(outputs.ciGap)}`,
      `Total shortfall $${formatMoney(outputs.totalGap)}`,
      `Risk ${outputs.riskLabel}`,
    ].join(" • ");
  }, [outputs]);

  const readiness = useMemo(() => {
    const missing: string[] = [];
    if (age <= 0) missing.push("Age");
    if (annualEssentials <= 0) missing.push(moneyMode === "monthly" ? "Monthly essentials" : "Annual essentials");
    if (supportYears <= 0) missing.push("Support years");
    return { missing, ready: missing.length === 0 };
  }, [age, annualEssentials, supportYears, moneyMode]);

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    if (next === "needs" && !canGoNeeds) return;
    if (next === "existing" && !canGoExisting) return;
    if (next === "results" && !canGoResults) return;
    setStep(next);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    const prev = STEP_ORDER[Math.max(idx - 1, 0)];
    setStep(prev);
  }

  const chartItems = useMemo(() => {
    if (!outputs) return [];
    return [
      { key: "Death", need: outputs.deathNeed, existing: outputs.exDeath },
      { key: "Disability (TPD)", need: outputs.tpdNeed, existing: outputs.exTPD },
      { key: "Critical Illness", need: outputs.ciNeed, existing: outputs.exCI },
    ].map((x) => {
      const need = Math.max(0, x.need);
      const ex = clamp(Math.max(0, x.existing), 0, need);
      const gap = Math.max(need - ex, 0);
      return { name: x.key, Coverage: ex, Shortfall: gap };
    });
  }, [outputs]);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-transparent">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14 py-6 space-y-5">
        <div className="mx-auto w-full max-w-[1680px] space-y-5">
          <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
            ← Back to tools
          </a>

          <div
            className={[
              "relative overflow-hidden rounded-[34px]",
              "border border-[color:var(--cs-border)]",
              "bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.65]",
              "shadow-[0_18px_45px_rgba(0,0,0,0.08)]",
            ].join(" ")}
          >
            <div className="absolute -top-36 -left-24 h-80 w-80 rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />
            <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />

            <div className="relative p-6 sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="cs-badge">Educational self-check</span>
                    <span className="cs-badge">No product names</span>
                    <span className="cs-badge">Simple assumptions</span>
                  </div>

                  <div className="flex items-end gap-3 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{titleLine}</h1>
                    {outputs ? <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span> : null}
                  </div>

                  <p className="text-[var(--cs-muted)] max-w-2xl leading-relaxed">
                    {topHint} This tool is general information only — not financial advice and not a recommendation.
                  </p>

                  <Stepper
                    step={step}
                    onGo={(k) => {
                      if (k === "profile") return setStep("profile");
                      if (k === "needs") return setStep(canGoNeeds ? "needs" : "profile");
                      if (k === "existing") return setStep(canGoExisting ? "existing" : "needs");
                      if (k === "results") return setStep(canGoResults ? "results" : "existing");
                    }}
                  />
                </div>

                <div className="w-full">
                  <div className="rounded-[26px] bg-white/70 backdrop-blur border border-[color:var(--cs-border)] shadow-[0_10px_25px_rgba(0,0,0,0.06)] p-5">
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
                      <div className="text-xs text-[var(--cs-muted)]">Input mode</div>
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

                    <div className="mt-4 rounded-2xl bg-[color:var(--cs-card)/0.5] border border-[color:var(--cs-border)] p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Readiness</div>
                        <span
                          className={
                            readiness.ready
                              ? "text-emerald-700 text-xs font-semibold"
                              : "text-amber-700 text-xs font-semibold"
                          }
                        >
                          {readiness.ready ? "Ready ✓" : "Almost"}
                        </span>
                      </div>

                      {readiness.ready ? (
                        <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                          You can proceed to Results anytime. Existing cover is optional (blank = $0).
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                          Missing:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">{readiness.missing.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                      Tip: Start rough. You can refine numbers later — the goal is clarity, not perfection.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <div className="space-y-5">
              {step === "profile" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Profile</div>
                      <div className="text-sm text-[var(--cs-muted)]">
                        Just enough to keep the tool human-friendly. Optional hints only.
                      </div>
                    </div>

                    <div className="relative">
                      <div className="h-14 w-14 rounded-3xl bg-white/70 border border-[color:var(--cs-border)] flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 21s-7-4.35-9.33-9.07C.66 7.64 3.02 4.5 6.5 4.5c1.74 0 3.22.8 4.1 2.02C11.28 5.3 12.76 4.5 14.5 4.5c3.48 0 5.84 3.14 3.83 7.43C19 16.65 12 21 12 21z"
                            stroke="rgba(36,20,48,0.7)"
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
                      <div className="absolute -inset-2 rounded-[28px] border border-[rgba(108,92,231,0.16)]" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-1">
                      <div className="text-sm font-semibold">Age</div>
                      <input
                        inputMode="numeric"
                        className="cs-input"
                        value={ageRaw}
                        onChange={(e) => setAgeRaw(stripToDigits(e.target.value))}
                        placeholder="e.g. 25"
                      />
                      <div className="text-xs text-[var(--cs-muted)]">Used only for an optional life-expectancy hint.</div>
                    </label>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold">Gender</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGender("male")}
                          className={["cs-btn w-full", gender === "male" ? "cs-btn-primary" : "cs-btn-ghost"].join(" ")}
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
                        <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
                          Singapore average life expectancy at birth:{" "}
                          <span className="font-semibold text-[var(--cs-text)]">{lifeExpectancyHint}</span> (2024 residents).{" "}
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
                            className={["cs-btn w-full", dependents === n ? "cs-btn-primary" : "cs-btn-ghost"].join(" ")}
                          >
                            {n === 3 ? "3+" : String(n)}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-[var(--cs-muted)]">Anyone relying on your income (parents / partner / kids).</div>
                    </div>
                  </div>

                  <div className="rounded-[26px] bg-[color:var(--cs-card)/0.5] border border-[color:var(--cs-border)] p-5">
                    <div className="text-sm font-semibold">Mini explainer (plain English)</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                        <div className="text-xs text-[var(--cs-muted)]">Death</div>
                        <div className="text-sm font-semibold text-[var(--cs-text)]">Family support</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">Money they may need if you’re gone.</div>
                      </div>
                      <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                        <div className="text-xs text-[var(--cs-muted)]">TPD</div>
                        <div className="text-sm font-semibold text-[var(--cs-text)]">Can’t work</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">Replace essentials partially for some years.</div>
                      </div>
                      <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                        <div className="text-xs text-[var(--cs-muted)]">Critical Illness</div>
                        <div className="text-sm font-semibold text-[var(--cs-text)]">Off work + buffer</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">Cash cushion during treatment + recovery.</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoNeeds}>
                      Next
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "needs" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Your needs</div>
                      <div className="text-sm text-[var(--cs-muted)]">Keep it simple. You can refine later — this is a clarity tool.</div>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setShowBenchmarks((v) => !v)}>
                        {showBenchmarks ? "Hide benchmarks" : "Show benchmarks"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-5 space-y-4">
                    <div className="text-sm font-semibold">1) Essentials (must-pay)</div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1">
                        <div className="text-sm font-semibold">
                          {moneyMode === "monthly" ? "Monthly essential expenses (SGD)" : "Annual essential expenses (SGD)"}
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                          <input
                            inputMode="numeric"
                            className="cs-input pl-7"
                            value={essentialsRaw ? formatMoneySGD(parseMoney(essentialsRaw)) : ""}
                            onChange={(e) => setEssentialsRaw(stripToDigits(e.target.value))}
                            placeholder={moneyMode === "monthly" ? "e.g. 3,000" : "e.g. 36,000"}
                          />
                        </div>
                        <div className="text-xs text-[var(--cs-muted)]">
                          Rent/mortgage, bills, food, parents allowance, kids costs, loan repayments.
                        </div>
                      </label>

                      <label className="space-y-1">
                        <div className="text-sm font-semibold">Support duration (years)</div>
                        <input
                          inputMode="numeric"
                          className="cs-input"
                          value={supportYearsRaw}
                          onChange={(e) => setSupportYearsRaw(stripToDigits(e.target.value))}
                          placeholder="e.g. 20"
                        />
                        <div className="text-xs text-[var(--cs-muted)]">Default set based on dependents. Common range: 10–25.</div>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-5 space-y-4">
                    <div className="text-sm font-semibold">2) One-time items (optional)</div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1">
                        <div className="text-sm font-semibold">Immediate cash buffer (optional)</div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                          <input
                            inputMode="numeric"
                            className="cs-input pl-7"
                            value={cashBufferRaw ? formatMoneySGD(parseMoney(cashBufferRaw)) : ""}
                            onChange={(e) => setCashBufferRaw(stripToDigits(e.target.value))}
                            placeholder="e.g. 30,000"
                          />
                        </div>
                        <div className="text-xs text-[var(--cs-muted)]">Funeral + 3–6 months breathing room.</div>
                      </label>

                      <label className="space-y-1">
                        <div className="text-sm font-semibold">Outstanding debts to clear (optional)</div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                          <input
                            inputMode="numeric"
                            className="cs-input pl-7"
                            value={debtsRaw ? formatMoneySGD(parseMoney(debtsRaw)) : ""}
                            onChange={(e) => setDebtsRaw(stripToDigits(e.target.value))}
                            placeholder="e.g. 120,000"
                          />
                        </div>
                        <div className="text-xs text-[var(--cs-muted)]">Loans you don’t want family to inherit.</div>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">3) If you can’t work (TPD)</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">How much of essentials still need replacing?</div>
                        </div>
                        <span className="cs-badge">Adjustable</span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div>
                          <div className="text-sm font-semibold">Replace essentials: {replaceEssentialsPct}%</div>
                          <input
                            type="range"
                            min={30}
                            max={100}
                            value={replaceEssentialsPct}
                            onChange={(e) => setReplaceEssentialsPct(Number(e.target.value))}
                            className="w-full mt-2"
                          />
                          <div className="text-xs text-[var(--cs-muted)] mt-2">Starter range: 50–70% for most people.</div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold">For how long: {tpdYearsCover} years</div>
                          <input
                            type="range"
                            min={1}
                            max={Math.max(5, Math.min(40, yearsRemainingHint ? Math.round(yearsRemainingHint) : 30))}
                            value={tpdYearsCover}
                            onChange={(e) => setTpdYearsCover(Number(e.target.value))}
                            className="w-full mt-2"
                          />
                          <div className="text-xs text-[var(--cs-muted)] mt-2">If unsure: 5–10 years is a common starting point.</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">4) If you fall seriously ill (CI)</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">How long might you be off work?</div>
                        </div>
                        <span className="cs-badge">Adjustable</span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div>
                          <div className="text-sm font-semibold">{ciMonthsOff} months off</div>
                          <input
                            type="range"
                            min={6}
                            max={60}
                            step={6}
                            value={ciMonthsOff}
                            onChange={(e) => setCiMonthsOff(Number(e.target.value))}
                            className="w-full mt-2"
                          />
                          <div className="text-xs text-[var(--cs-muted)] mt-2">Common starter: 12–24 months.</div>
                        </div>

                        <label className="space-y-1">
                          <div className="text-sm font-semibold">Extra out-of-pocket buffer (optional)</div>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                            <input
                              inputMode="numeric"
                              className="cs-input pl-7"
                              value={ciExtraBufferRaw ? formatMoneySGD(parseMoney(ciExtraBufferRaw)) : ""}
                              onChange={(e) => setCiExtraBufferRaw(stripToDigits(e.target.value))}
                              placeholder="e.g. 20,000"
                            />
                          </div>
                          <div className="text-xs text-[var(--cs-muted)]">Transport, caregiver costs, misc non-covered expenses.</div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {showBenchmarks ? (
                    <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Benchmarks (optional reference)</div>
                          <div className="text-sm text-[var(--cs-muted)]">
                            Based on MoneySense “rules of thumb”. Your situation can be different.
                          </div>
                        </div>
                        <a className="cs-btn cs-btn-ghost" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                          View source
                        </a>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/75 border border-[color:var(--cs-border)] p-4">
                          <div className="text-xs text-[var(--cs-muted)]">Death & TPD</div>
                          <div className="text-lg font-bold">9× annual</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">Basic thumb rule.</div>
                        </div>
                        <div className="rounded-2xl bg-white/75 border border-[color:var(--cs-border)] p-4">
                          <div className="text-xs text-[var(--cs-muted)]">Critical illness</div>
                          <div className="text-lg font-bold">4× annual</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">Basic thumb rule.</div>
                        </div>
                        <div className="rounded-2xl bg-white/75 border border-[color:var(--cs-border)] p-4">
                          <div className="text-xs text-[var(--cs-muted)]">Spend guideline</div>
                          <div className="text-lg font-bold">Up to 15%</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">Of income (guide only).</div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoExisting}>
                      Next
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "existing" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="space-y-1">
                    <div className="text-lg font-bold tracking-tight">Existing cover</div>
                    <div className="text-sm text-[var(--cs-muted)]">
                      Optional — but it makes the gap snapshot more accurate. Leave blank if unsure.
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-1">
                      <div className="text-sm font-semibold">Death (SGD)</div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                        <input
                          inputMode="numeric"
                          className="cs-input pl-7"
                          value={existingDeathRaw ? formatMoneySGD(parseMoney(existingDeathRaw)) : ""}
                          onChange={(e) => setExistingDeathRaw(stripToDigits(e.target.value))}
                          placeholder="e.g. 500,000"
                        />
                      </div>
                    </label>

                    <label className="space-y-1">
                      <div className="text-sm font-semibold">TPD (SGD)</div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                        <input
                          inputMode="numeric"
                          className="cs-input pl-7"
                          value={existingTPDRaw ? formatMoneySGD(parseMoney(existingTPDRaw)) : ""}
                          onChange={(e) => setExistingTPDRaw(stripToDigits(e.target.value))}
                          placeholder="e.g. 500,000"
                        />
                      </div>
                    </label>

                    <label className="space-y-1">
                      <div className="text-sm font-semibold">Critical Illness (SGD)</div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] text-sm">$</div>
                        <input
                          inputMode="numeric"
                          className="cs-input pl-7"
                          value={existingCIRaw ? formatMoneySGD(parseMoney(existingCIRaw)) : ""}
                          onChange={(e) => setExistingCIRaw(stripToDigits(e.target.value))}
                          placeholder="e.g. 200,000"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                    <div className="text-sm font-semibold">Quick tips (avoid confusion)</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="cs-badge">Use total coverage amount</span>
                      <span className="cs-badge">Include all companies</span>
                      <span className="cs-badge">Blank = $0 (still works)</span>
                    </div>
                    <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                      If you’re unsure, it’s totally fine to leave it blank. You’ll still see a “needs” estimate.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoResults}>
                      Show results
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "results" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Results</div>
                      <div className="text-sm text-[var(--cs-muted)]">Coverage vs shortfall view. General information only — not advice.</div>
                    </div>

                    {outputs ? (
                      <div className="flex items-center gap-3">
                        <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span>
                        <div className="rounded-2xl bg-[color:var(--cs-card)/0.6] border border-[color:var(--cs-border)] px-4 py-2">
                          <div className="text-xs text-[var(--cs-muted)]">Total shortfall</div>
                          <div className={["text-lg font-bold tracking-tight", softRiskTone(outputs.riskLabel)].join(" ")}>
                            ${formatMoney(outputs.totalGap)}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {!outputs ? (
                    <div className="text-sm text-[var(--cs-muted)]">Please complete your inputs first.</div>
                  ) : (
                    <>
                      <div className="grid gap-4 xl:grid-cols-2">
                        <HeroCoverageChart
                          items={[
                            { key: "Death", need: outputs.deathNeed, existing: outputs.exDeath, accent: "purple" },
                            { key: "Disability (TPD)", need: outputs.tpdNeed, existing: outputs.exTPD, accent: "teal" },
                            { key: "Critical Illness", need: outputs.ciNeed, existing: outputs.exCI, accent: "rose" },
                          ]}
                        />
                        <CoverageBarChart items={chartItems} />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        <ResultCard
                          title="Death"
                          subtitle="Family support + one-time items"
                          need={outputs.deathNeed}
                          existing={outputs.exDeath}
                          accent="purple"
                          insight={`Based on essentials × ${outputs.supportYears} years + optional buffer/debts.`}
                        />
                        <ResultCard
                          title="Disability (TPD)"
                          subtitle="Can’t work — partial replacement"
                          need={outputs.tpdNeed}
                          existing={outputs.exTPD}
                          accent="teal"
                          insight={`Based on ${replaceEssentialsPct}% of essentials for ${tpdYearsCover} years.`}
                        />
                        <ResultCard
                          title="Critical Illness"
                          subtitle="Off work + buffer"
                          need={outputs.ciNeed}
                          existing={outputs.exCI}
                          accent="rose"
                          insight={`Based on ${ciMonthsOff} months off work + optional extra buffer.`}
                        />
                      </div>

                      <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                          <div>
                            <div className="text-sm font-semibold">What you keyed in</div>
                            <div className="text-sm text-[var(--cs-muted)] mt-2 leading-relaxed">
                              Essentials (annualised):{" "}
                              <span className="font-semibold text-[var(--cs-text)]">${formatMoney(outputs.annualEssentials)}</span>{" "}
                              • Support years:{" "}
                              <span className="font-semibold text-[var(--cs-text)]">{outputs.supportYears}</span>{" "}
                              • TPD:{" "}
                              <span className="font-semibold text-[var(--cs-text)]">
                                {replaceEssentialsPct}% × {tpdYearsCover}y
                              </span>{" "}
                              • CI:{" "}
                              <span className="font-semibold text-[var(--cs-text)]">{ciMonthsOff} months</span>
                            </div>

                            {benchmark ? (
                              <div className="text-xs text-[var(--cs-muted)] mt-3 leading-relaxed">
                                Optional benchmark (MoneySense): Death/TPD about{" "}
                                <span className="font-semibold text-[var(--cs-text)]">${formatMoney(benchmark.deathTpdThumb)}</span>{" "}
                                (9× annual), CI about{" "}
                                <span className="font-semibold text-[var(--cs-text)]">${formatMoney(benchmark.ciThumb)}</span>{" "}
                                (4× annual).{" "}
                                <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                                  Source
                                </a>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <a className="cs-btn cs-btn-primary" href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}>
                              Request a chat
                            </a>
                            <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("needs")}>
                              Adjust inputs
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                        <div className="text-sm font-semibold">Important note</div>
                        <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                          Disclaimer: General information only. Not financial advice and not a product recommendation. This tool does not account
                          for medical inflation, CPF, underwriting, exclusions, policy definitions, or detailed liabilities.
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
              <div className="cs-card p-5 rounded-[26px] shadow-[0_18px_45px_rgba(0,0,0,0.06)] lg:sticky lg:top-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Live mini-summary</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Updates as you type — keeps it clear.</div>
                  </div>
                  {outputs ? <span className={badgeClass(outputs.riskLabel)}>{outputs.riskLabel}</span> : null}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <SummaryRow label="Mode" value={moneyMode === "monthly" ? "Monthly input" : "Annual input"} />
                  <SummaryRow label="Essentials (annual)" value={annualEssentials > 0 ? `$${formatMoney(annualEssentials)}` : "—"} />
                  <SummaryRow label="Support years" value={supportYears > 0 ? `${supportYears} years` : "—"} />
                  <SummaryRow label="TPD" value={`${replaceEssentialsPct}% × ${tpdYearsCover}y`} />
                  <SummaryRow label="CI" value={`${ciMonthsOff} months`} />
                  <SummaryRow label="Dependents" value={dependents === 3 ? "3+" : String(dependents)} />
                </div>

                {outputs ? (
                  <div className="mt-4 rounded-[22px] bg-[color:var(--cs-card)/0.6] border border-[color:var(--cs-border)] p-4">
                    <div className="text-xs text-[var(--cs-muted)]">Total shortfall</div>
                    <div className="mt-1 text-2xl font-bold tracking-tight">${formatMoney(outputs.totalGap)}</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Educational estimate from your inputs.</div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[22px] bg-[color:var(--cs-card)/0.6] border border-[color:var(--cs-border)] p-4">
                    <div className="text-xs text-[var(--cs-muted)]">Next step</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--cs-text)]">
                      Key in essentials + support years to generate results.
                    </div>
                    <div className="mt-2 text-xs text-[var(--cs-muted)]">
                      Missing:{" "}
                      <span className="font-semibold text-[var(--cs-text)]">{readiness.missing.join(", ") || "—"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="cs-card p-5 rounded-[26px]">
                <div className="text-sm font-semibold">Make it beginner-friendly</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">If you’re guiding someone new, use this order:</div>
                <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
                  <li>Essentials + support years</li>
                  <li>Set CI months (start with 12–24)</li>
                  <li>Adjust TPD % + years if needed</li>
                  <li>Only then fill existing cover</li>
                </ol>
              </div>

              <div className="cs-card p-5 rounded-[26px]">
                <div className="text-sm font-semibold">Sources (for trust)</div>
                <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                  Life expectancy hint: Singapore Department of Statistics life tables (2023–2024).{" "}
                  <a className="underline" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                    View
                  </a>
                  <br />
                  Benchmarks: MoneySense basic financial planning guide (9× annual for Death/TPD, 4× annual for CI, up to 15% guideline).{" "}
                  <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper(props: { step: StepKey; onGo: (k: StepKey) => void }) {
  const idx = STEP_ORDER.indexOf(props.step);

  const steps: Array<{ k: StepKey; label: string; sub: string }> = [
    { k: "profile", label: "Profile", sub: "Basics + hints" },
    { k: "needs", label: "Needs", sub: "What to protect" },
    { k: "existing", label: "Existing", sub: "What you have" },
    { k: "results", label: "Results", sub: "Gaps + chart" },
  ];

  return (
    <div className="mt-4 rounded-[26px] bg-white/60 border border-[color:var(--cs-border)] p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <button
              key={s.k}
              type="button"
              onClick={() => props.onGo(s.k)}
              className={[
                "text-left rounded-2xl px-3 py-3 transition",
                active ? "bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)]" : "hover:bg-white/70",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-[var(--cs-muted)] mt-0.5">{s.sub}</div>
                </div>
                <div
                  className={[
                    "h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0",
                    active
                      ? "bg-[color:var(--cs-card)/0.75] border-[color:var(--cs-border)]"
                      : done
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-white/60 border-[color:var(--cs-border)]",
                  ].join(" ")}
                >
                  <span className="text-sm">{done ? "✓" : active ? "●" : "○"}</span>
                </div>
              </div>
            </button>
          );
        })}
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

function CoverageBarChart(props: { items: Array<{ name: string; Coverage: number; Shortfall: number }> }) {
  const fmt = (n: number) => `$${formatMoney(n)}`;

  return (
    <div className="rounded-[28px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="text-sm font-semibold">Graph view</div>
          <div className="text-xs text-[var(--cs-muted)] mt-1">Stacked: coverage + shortfall</div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--cs-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
            Coverage
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/55" />
            Shortfall
          </div>
        </div>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.items} layout="vertical" margin={{ top: 6, right: 18, left: 8, bottom: 6 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              stroke="rgba(36,20,48,0.35)"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              stroke="rgba(36,20,48,0.35)"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: any, name: any) => [fmt(Number(value)), String(name)]}
              cursor={{ fill: "rgba(36,20,48,0.06)" }}
            />
            <Legend />
            <Bar dataKey="Coverage" stackId="a" fill="#22c55e" radius={[10, 10, 10, 10]} />
            <Bar dataKey="Shortfall" stackId="a" fill="#ef4444" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HeroCoverageChart(props: {
  items: Array<{ key: string; need: number; existing: number; accent: "purple" | "teal" | "rose" }>;
}) {
  const maxNeed = useMemo(() => Math.max(...props.items.map((x) => x.need), 1), [props.items]);

  function accentDot(accent: "purple" | "teal" | "rose") {
    if (accent === "purple") return "bg-[rgba(108,92,231,0.35)]";
    if (accent === "teal") return "bg-[rgba(0,184,148,0.35)]";
    return "bg-[rgba(232,67,147,0.32)]";
  }

  return (
    <div className="rounded-[28px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="text-sm font-semibold">Coverage summary</div>
          <div className="text-xs text-[var(--cs-muted)] mt-1">Green = existing coverage • Red = shortfall</div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--cs-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
            Existing
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/55" />
            Shortfall
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {props.items.map((it) => {
          const need = Math.max(0, it.need);
          const ex = clamp(Math.max(0, it.existing), 0, need);
          const gap = Math.max(need - ex, 0);

          const pctNeed = clamp((need / maxNeed) * 100, 2, 100);
          const pctExWithinNeed = need <= 0 ? 0 : clamp((ex / need) * 100, 0, 100);
          const pctGapWithinNeed = 100 - pctExWithinNeed;

          return (
            <div key={it.key} className="grid gap-3 lg:grid-cols-[180px_1fr_260px] items-center">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "h-9 w-9 rounded-2xl border border-[color:var(--cs-border)] bg-[color:var(--cs-card)/0.5] flex items-center justify-center",
                    accentDot(it.accent),
                  ].join(" ")}
                />
                <div>
                  <div className="text-sm font-semibold">{it.key}</div>
                  <div className="text-xs text-[var(--cs-muted)]">Need ${formatMoney(need)}</div>
                </div>
              </div>

              <div className="rounded-full bg-[color:var(--cs-card)/0.75] border border-[color:var(--cs-border)] h-4 overflow-hidden">
                <div className="h-full rounded-full bg-[rgba(36,20,48,0.08)]" style={{ width: `${pctNeed}%` }}>
                  <div className="h-full bg-emerald-500/45" style={{ width: `${pctExWithinNeed}%` }} />
                  <div className="h-full bg-rose-500/55" style={{ width: `${pctGapWithinNeed}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] px-3 py-2">
                  <div className="text-[10px] text-[var(--cs-muted)]">Existing</div>
                  <div className="text-sm font-semibold">${formatMoney(ex)}</div>
                </div>
                <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] px-3 py-2">
                  <div className="text-[10px] text-[var(--cs-muted)]">Shortfall</div>
                  <div className="text-sm font-semibold text-rose-700">${formatMoney(gap)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard(props: {
  title: string;
  subtitle: string;
  need: number;
  existing: number;
  accent: "purple" | "teal" | "rose";
  insight: string;
}) {
  const need = Math.max(0, props.need);
  const existing = clamp(Math.max(0, props.existing), 0, need);
  const gap = Math.max(need - existing, 0);

  const accentBg =
    props.accent === "purple"
      ? "bg-[rgba(108,92,231,0.10)]"
      : props.accent === "teal"
      ? "bg-[rgba(0,184,148,0.10)]"
      : "bg-[rgba(232,67,147,0.09)]";

  const accentStroke =
    props.accent === "purple"
      ? "rgba(108,92,231,0.26)"
      : props.accent === "teal"
      ? "rgba(0,184,148,0.26)"
      : "rgba(232,67,147,0.24)";

  return (
    <div className="rounded-[26px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{props.title}</div>
          <div className="text-xs text-[var(--cs-muted)] mt-0.5">{props.subtitle}</div>
        </div>
        <div className={["h-10 w-10 rounded-3xl border flex items-center justify-center", accentBg].join(" ")} style={{ borderColor: accentStroke }}>
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: accentStroke }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-4">
          <div className="text-[10px] text-[var(--cs-muted)]">Need</div>
          <div className="text-lg font-bold tracking-tight">${formatMoney(need)}</div>
        </div>
        <div className="rounded-2xl bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-4">
          <div className="text-[10px] text-[var(--cs-muted)]">Shortfall</div>
          <div className={["text-lg font-bold tracking-tight", gap > 0 ? "text-rose-700" : "text-emerald-700"].join(" ")}>
            ${formatMoney(gap)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
        <div className="text-xs text-[var(--cs-muted)]">Why this number</div>
        <div className="text-sm text-[var(--cs-text)] font-semibold mt-1">{props.insight}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
          <div className="text-[10px] text-[var(--cs-muted)]">Existing</div>
          <div className="text-sm font-semibold">${formatMoney(existing)}</div>
        </div>
        <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
          <div className="text-[10px] text-[var(--cs-muted)]">Shortfall</div>
          <div className="text-sm font-semibold text-rose-700">${formatMoney(gap)}</div>
        </div>
      </div>
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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
};

const STEP_ORDER: StepKey[] = ["profile", "needs", "existing", "results"];

const SG_LE_AT_BIRTH_2024 = {
  male: 81.2,
  female: 85.6,
  overall: 83.5,
};

const SOURCES = {
  singstatLifeTables: "https://www.singstat.gov.sg/-/media/files/publications/population/lifetable23-24.ashx",
  moneysenseBfpg: "https://www.moneysense.gov.sg/planning-your-finances-well/",
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

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

function niceToolLabel(tool: string) {
  const t = (tool || "").toLowerCase();
  if (t === "protection") return "Protection Gap Check";
  return "Protection Gap Check";
}

function computeOutputs(args: {
  annualEssentials: number;
  supportYears: number;
  cashBuffer: number;
  debts: number;
  essentialsStillNeededPct: number;
  tpdYearsCover: number;
  ciMonthsOff: number;
  ciExtra: number;
  exDeath: number;
  exTPD: number;
  exCI: number;
}): Outputs | null {
  const a = Math.max(0, args.annualEssentials);
  const y = Math.max(0, args.supportYears);
  if (a <= 0 || y <= 0) return null;

  const cashBuffer = Math.max(0, args.cashBuffer);
  const debts = Math.max(0, args.debts);
  const ciExtra = Math.max(0, args.ciExtra);

  const exDeath = Math.max(0, args.exDeath);
  const exTPD = Math.max(0, args.exTPD);
  const exCI = Math.max(0, args.exCI);

  const deathNeed = a * y + cashBuffer + debts;

  const essentialsStillNeededPct = clamp(args.essentialsStillNeededPct, 0, 100) / 100;
  const tpdNeed = a * Math.max(0, args.tpdYearsCover) * essentialsStillNeededPct;

  const ciNeed = (a / 12) * Math.max(0, args.ciMonthsOff) + ciExtra;

  const deathGap = Math.max(deathNeed - exDeath, 0);
  const tpdGap = Math.max(tpdNeed - exTPD, 0);
  const ciGap = Math.max(ciNeed - exCI, 0);

  return {
    annualEssentials: a,
    supportYears: y,
    deathNeed,
    tpdNeed,
    ciNeed,
    deathGap,
    tpdGap,
    ciGap,
    totalGap: deathGap + tpdGap + ciGap,
    exDeath,
    exTPD,
    exCI,
  };
}

function Surface(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[34px] border border-[var(--cs-border)] bg-white/70 backdrop-blur",
        "shadow-[0_18px_60px_rgba(15,43,31,0.08)]",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

function SoftGlow() {
  return (
    <>
      <div className="absolute -top-44 -left-44 h-[560px] w-[560px] rounded-full bg-[rgba(0,184,148,0.10)] blur-3xl" />
      <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-[rgba(108,92,231,0.12)] blur-3xl" />
    </>
  );
}

function Badge(props: { text: string; dot?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--cs-border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--cs-muted)]">
      {props.dot ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--cs-brand)]" /> : null}
      {props.text}
    </span>
  );
}

function SectionTitle(props: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
      <div className="space-y-1">
        <div className="text-lg sm:text-xl font-extrabold tracking-tight">{props.title}</div>
        {props.subtitle ? <div className="text-sm text-[var(--cs-muted)] leading-relaxed">{props.subtitle}</div> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  );
}

function FieldShell(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{props.label}</div>
      {props.children}
      {props.hint ? <div className="text-xs text-[var(--cs-muted)] leading-relaxed">{props.hint}</div> : null}
    </div>
  );
}

function PrefixMoneyInput(props: { valueRaw: string; setValueRaw: (v: string) => void; placeholder?: string }) {
  const display = props.valueRaw ? formatMoneySGD(parseMoney(props.valueRaw)) : "";
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white/85 px-3 py-3 focus-within:ring-2 focus-within:ring-[rgba(47,107,79,0.18)]">
      <div className="text-sm font-semibold text-[var(--cs-muted)]">$</div>
      <input
        inputMode="numeric"
        className="w-full outline-none bg-transparent text-[var(--cs-text)]"
        value={display}
        onChange={(e) => props.setValueRaw(stripToDigits(e.target.value))}
        placeholder={props.placeholder || "e.g. 50,000"}
      />
    </div>
  );
}

function SimpleNumberInput(props: { valueRaw: string; setValueRaw: (v: string) => void; placeholder?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white/85 px-3 py-3 focus-within:ring-2 focus-within:ring-[rgba(47,107,79,0.18)]">
      <input
        inputMode="numeric"
        className="w-full outline-none bg-transparent text-[var(--cs-text)]"
        value={props.valueRaw}
        onChange={(e) => props.setValueRaw(stripToDigits(e.target.value))}
        placeholder={props.placeholder || "e.g. 20"}
      />
    </div>
  );
}

function Segmented(props: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-[var(--cs-border)] bg-white/75 p-1">
      {props.options.map((o) => {
        const active = props.value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => props.onChange(o.value)}
            className={cx(
              "px-3 py-2 rounded-xl text-sm font-semibold transition",
              active ? "bg-[var(--cs-text)] text-white" : "text-[var(--cs-text)] hover:bg-[var(--cs-card)]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StepTabs(props: { step: StepKey; canGo: (k: StepKey) => boolean; onGo: (k: StepKey) => void }) {
  const items: Array<{ k: StepKey; label: string; sub: string }> = [
    { k: "profile", label: "Profile", sub: "Basics + hint" },
    { k: "needs", label: "Needs", sub: "What to protect" },
    { k: "existing", label: "Existing", sub: "What you have" },
    { k: "results", label: "Results", sub: "Snapshot" },
  ];

  const idx = STEP_ORDER.indexOf(props.step);

  return (
    <div className="rounded-[28px] border border-[var(--cs-border)] bg-white/70 p-2">
      <div className="grid gap-2 sm:grid-cols-4">
        {items.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          const allowed = props.canGo(s.k);

          return (
            <button
              key={s.k}
              type="button"
              onClick={() => props.onGo(s.k)}
              disabled={!allowed}
              className={cx(
                "text-left rounded-2xl px-3 py-3 transition",
                active
                  ? "bg-white shadow-[0_14px_40px_rgba(15,43,31,0.10)]"
                  : "hover:bg-white/70",
                !allowed && !active ? "opacity-45 cursor-not-allowed" : ""
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold truncate">{s.label}</div>
                  <div className="text-xs text-[var(--cs-muted)] mt-0.5 truncate">{s.sub}</div>
                </div>
                <div
                  className={cx(
                    "h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0",
                    active
                      ? "bg-[color:var(--cs-card)/0.70] border-[var(--cs-border)]"
                      : done
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-white/70 border-[var(--cs-border)]"
                  )}
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

function StatChip(props: { label: string; value: string; tone?: "good" | "warn" | "risk" }) {
  const tone =
    props.tone === "good"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : props.tone === "warn"
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : props.tone === "risk"
      ? "text-rose-700 bg-rose-50 border-rose-100"
      : "text-[var(--cs-text)] bg-[var(--cs-card)] border-[var(--cs-border)]";

  return (
    <div className={cx("rounded-2xl border px-4 py-3", tone)}>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{props.label}</div>
      <div className="text-lg font-extrabold tracking-tight">{props.value}</div>
    </div>
  );
}

function CategorySnapshotCard(props: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  need: number;
  existing: number;
  gap: number;
  why: string;
  accent: "green" | "purple" | "rose";
}) {
  const accentBorder =
    props.accent === "green"
      ? "border-emerald-100"
      : props.accent === "purple"
      ? "border-violet-100"
      : "border-rose-100";

  const accentBg =
    props.accent === "green"
      ? "bg-emerald-50"
      : props.accent === "purple"
      ? "bg-violet-50"
      : "bg-rose-50";

  const gapTone = props.gap > 0 ? "risk" : "good";

  return (
    <Surface className={cx("p-6", accentBorder)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cx("h-11 w-11 rounded-2xl border border-[var(--cs-border)] flex items-center justify-center", accentBg)}>
            {props.icon}
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight truncate">{props.title}</div>
            <div className="text-xs text-[var(--cs-muted)] mt-0.5">{props.subtitle}</div>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-[var(--cs-border)] bg-white/70">
          Estimate
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatChip label="Need" value={`$${formatMoneySGD(props.need)}`} />
        <StatChip label="Coverage" value={`$${formatMoneySGD(props.existing)}`} tone="good" />
        <StatChip label="Shortfall" value={`$${formatMoneySGD(props.gap)}`} tone={gapTone} />
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-white/75 p-4">
        <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">Why this number</div>
        <div className="mt-1 text-sm font-semibold text-[var(--cs-text)]">{props.why}</div>
      </div>
    </Surface>
  );
}

function CoverageBars(props: { rows: Array<{ name: string; coverage: number; shortfall: number }> }) {
  const fmt = (n: number) => `$${formatMoneySGD(n)}`;

  return (
    <Surface className="p-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="text-sm font-semibold">Coverage summary</div>
          <div className="text-xs text-[var(--cs-muted)] mt-1">Stacked: coverage + shortfall</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--cs-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            Coverage
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
            Shortfall
          </div>
        </div>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.rows} layout="vertical" margin={{ top: 6, right: 16, left: 8, bottom: 6 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              stroke="rgba(36,20,48,0.35)"
              fontSize={12}
            />
            <YAxis type="category" dataKey="name" width={140} stroke="rgba(36,20,48,0.35)" fontSize={12} />
            <Tooltip formatter={(value: any, name: any) => [fmt(Number(value)), String(name)]} cursor={{ fill: "rgba(36,20,48,0.06)" }} />
            <Bar dataKey="coverage" stackId="a" fill="rgba(16,185,129,0.70)" radius={[10, 10, 10, 10]} />
            <Bar dataKey="shortfall" stackId="a" fill="rgba(244,63,94,0.70)" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}

export default function ProtectionGapTool() {
  const [step, setStep] = useState<StepKey>("profile");
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [ageRaw, setAgeRaw] = useState("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [dependents, setDependents] = useState<number>(0);

  const [essentialsRaw, setEssentialsRaw] = useState("");
  const [supportYearsRaw, setSupportYearsRaw] = useState("");

  const [cashBufferRaw, setCashBufferRaw] = useState("");
  const [debtsRaw, setDebtsRaw] = useState("");

  const [essentialsStillNeededPct, setEssentialsStillNeededPct] = useState<number>(60);
  const [tpdYearsCover, setTpdYearsCover] = useState<number>(10);

  const [ciMonthsOff, setCiMonthsOff] = useState<number>(24);
  const [ciExtraBufferRaw, setCiExtraBufferRaw] = useState<string>("20000");

  const [existingDeathRaw, setExistingDeathRaw] = useState("");
  const [existingTPDRaw, setExistingTPDRaw] = useState("");
  const [existingCIRaw, setExistingCIRaw] = useState("");

  const [showBenchmarks, setShowBenchmarks] = useState(true);

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
    if (dependents >= 2) return 20;
    if (dependents === 1) return 18;
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

  const supportYears = useMemo(() => Number(stripToDigits(supportYearsRaw || "0")) || 0, [supportYearsRaw]);

  const outputs = useMemo(() => {
    return computeOutputs({
      annualEssentials,
      supportYears,
      cashBuffer: parseMoney(cashBufferRaw),
      debts: parseMoney(debtsRaw),
      essentialsStillNeededPct,
      tpdYearsCover,
      ciMonthsOff,
      ciExtra: parseMoney(ciExtraBufferRaw),
      exDeath: parseMoney(existingDeathRaw),
      exTPD: parseMoney(existingTPDRaw),
      exCI: parseMoney(existingCIRaw),
    });
  }, [
    annualEssentials,
    supportYears,
    cashBufferRaw,
    debtsRaw,
    essentialsStillNeededPct,
    tpdYearsCover,
    ciMonthsOff,
    ciExtraBufferRaw,
    existingDeathRaw,
    existingTPDRaw,
    existingCIRaw,
  ]);

  const canGoNeeds = useMemo(() => age > 0, [age]);
  const canGoExisting = useMemo(() => annualEssentials > 0 && supportYears > 0, [annualEssentials, supportYears]);
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

  const summaryText = useMemo(() => {
    if (!outputs) return "";
    return [
      `${niceToolLabel("protection")}`,
      `Annual essentials $${formatMoneySGD(outputs.annualEssentials)}`,
      `Death shortfall $${formatMoneySGD(outputs.deathGap)}`,
      `TPD shortfall $${formatMoneySGD(outputs.tpdGap)}`,
      `CI shortfall $${formatMoneySGD(outputs.ciGap)}`,
      `Total shortfall $${formatMoneySGD(outputs.totalGap)}`,
    ].join(" • ");
  }, [outputs]);

  const chartRows = useMemo(() => {
    if (!outputs) return [];
    const rows = [
      { name: "Death", need: outputs.deathNeed, ex: outputs.exDeath },
      { name: "Disability (TPD)", need: outputs.tpdNeed, ex: outputs.exTPD },
      { name: "Critical Illness", need: outputs.ciNeed, ex: outputs.exCI },
    ];
    return rows.map((r) => {
      const need = Math.max(0, r.need);
      const coverage = clamp(Math.max(0, r.ex), 0, need);
      const shortfall = Math.max(need - coverage, 0);
      return { name: r.name, coverage, shortfall };
    });
  }, [outputs]);

  const benchmark = useMemo(() => {
    if (!outputs) return null;
    return {
      deathTpdThumb: outputs.annualEssentials * 9,
      ciThumb: outputs.annualEssentials * 4,
    };
  }, [outputs]);

  function canGo(k: StepKey) {
    if (k === "profile") return true;
    if (k === "needs") return canGoNeeds;
    if (k === "existing") return canGoExisting;
    return canGoResults;
  }

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    if (canGo(next)) setStep(next);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    const prev = STEP_ORDER[Math.max(idx - 1, 0)];
    setStep(prev);
  }

  return (
    <div className="min-h-[calc(100vh-40px)] bg-transparent">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14 py-6 space-y-6">
        <div className="mx-auto w-full max-w-[1680px] space-y-6">
          <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
            ← Back to tools
          </a>

          <Surface className="bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.65]">
            <SoftGlow />

            <div className="relative p-6 sm:p-10">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge text="Educational self-check" dot />
                    <Badge text="No product names" />
                    <Badge text="Singapore context" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Protection Gap Check</h1>
                    <p className="text-[var(--cs-muted)] max-w-2xl leading-relaxed">
                      A clean snapshot of possible shortfalls across Death / Disability (TPD) / Critical Illness. General information only — not financial advice and not a recommendation.
                    </p>
                  </div>

                  <StepTabs step={step} canGo={canGo} onGo={(k) => setStep(canGo(k) ? k : step)} />
                </div>

                <Surface className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Progress</div>
                    <div className="text-xs text-[var(--cs-muted)]">{Math.round(progress)}%</div>
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-[color:var(--cs-card)/0.85] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--cs-brand)]"
                      style={{ width: `${progress}%`, transition: "width 300ms ease" }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--cs-muted)]">Input mode</div>
                    <Segmented
                      value={moneyMode}
                      onChange={(v) => setMoneyMode(v as MoneyMode)}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "annual", label: "Per year" },
                      ]}
                    />
                  </div>

                  {outputs ? (
                    <div className="mt-4 rounded-3xl border border-[var(--cs-border)] bg-white/80 p-5">
                      <div className="text-xs text-[var(--cs-muted)]">Total estimated shortfall</div>
                      <div className="mt-1 text-3xl font-extrabold tracking-tight">${formatMoneySGD(outputs.totalGap)}</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Educational estimate from your inputs.</div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-3">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">Death</div>
                          <div className="text-sm font-extrabold">${formatMoneySGD(outputs.deathGap)}</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-3">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">TPD</div>
                          <div className="text-sm font-extrabold">${formatMoneySGD(outputs.tpdGap)}</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-3">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">CI</div>
                          <div className="text-sm font-extrabold">${formatMoneySGD(outputs.ciGap)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-[var(--cs-border)] bg-white/80 p-5">
                      <div className="text-xs text-[var(--cs-muted)]">Tip</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--cs-text)]">
                        Start rough. You can refine later — the goal is clarity, not perfection.
                      </div>
                      <div className="mt-3 text-xs text-[var(--cs-muted)] leading-relaxed">
                        Recommended flow: age → essentials → support years → CI months → TPD slider.
                      </div>
                    </div>
                  )}
                </Surface>
              </div>
            </div>
          </Surface>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <div className="space-y-6">
              {step === "profile" ? (
                <Surface className="p-6 sm:p-10">
                  <SectionTitle
                    title="Profile"
                    subtitle="Age + gender gives an optional SingStat life expectancy hint (not a personal prediction)."
                  />

                  <div className="mt-7 grid gap-5 sm:grid-cols-3">
                    <FieldShell label="Age" hint="Used only for the optional hint below.">
                      <SimpleNumberInput valueRaw={ageRaw} setValueRaw={setAgeRaw} placeholder="e.g. 25" />
                    </FieldShell>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Gender</div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender("male")}
                          className={cx("cs-btn w-full", gender === "male" ? "cs-btn-primary" : "cs-btn-ghost")}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("female")}
                          className={cx("cs-btn w-full", gender === "female" ? "cs-btn-primary" : "cs-btn-ghost")}
                        >
                          Female
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("unspecified")}
                          className={cx("cs-btn w-full", gender === "unspecified" ? "cs-btn-primary" : "cs-btn-ghost")}
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
                          Optional hint uses SingStat life tables (2023–2024).{" "}
                          <a className="underline" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Dependents</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setDependents(n)}
                            className={cx("cs-btn w-full", dependents === n ? "cs-btn-primary" : "cs-btn-ghost")}
                          >
                            {n === 3 ? "3+" : String(n)}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-[var(--cs-muted)]">Anyone relying on your income (parents / partner / kids).</div>
                    </div>
                  </div>

                  <div className="mt-7 rounded-[30px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.55] p-6">
                    <div className="text-sm font-semibold">Plain English: what this checks</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                        <div className="text-xs text-[var(--cs-muted)]">Death</div>
                        <div className="text-sm font-extrabold text-[var(--cs-text)]">Family support</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">Money they may need if you’re gone.</div>
                      </div>
                      <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                        <div className="text-xs text-[var(--cs-muted)]">Disability (TPD)</div>
                        <div className="text-sm font-extrabold text-[var(--cs-text)]">Income stops</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">How long essentials still need funding.</div>
                      </div>
                      <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                        <div className="text-xs text-[var(--cs-muted)]">Critical Illness</div>
                        <div className="text-sm font-extrabold text-[var(--cs-text)]">Time off work</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">Cash cushion during recovery.</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoNeeds}>
                      Next
                    </button>
                  </div>
                </Surface>
              ) : null}

              {step === "needs" ? (
                <Surface className="p-6 sm:p-10">
                  <SectionTitle
                    title="Your needs"
                    subtitle="Key in essentials + how long you want to protect them for. Keep it simple — refine later."
                    right={
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setShowBenchmarks((v) => !v)}>
                        {showBenchmarks ? "Hide benchmarks" : "Show benchmarks"}
                      </button>
                    }
                  />

                  <div className="mt-7 grid gap-5">
                    <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">1) Essentials (must-pay)</div>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <FieldShell
                          label={moneyMode === "monthly" ? "Monthly essential expenses (SGD)" : "Annual essential expenses (SGD)"}
                          hint="Rent/mortgage, bills, food, parents allowance, kids costs, loan repayments."
                        >
                          <PrefixMoneyInput
                            valueRaw={essentialsRaw}
                            setValueRaw={setEssentialsRaw}
                            placeholder={moneyMode === "monthly" ? "e.g. 3,000" : "e.g. 36,000"}
                          />
                        </FieldShell>

                        <FieldShell label="Support duration (years)" hint="Default adjusts with dependents. Common range: 10–25.">
                          <SimpleNumberInput valueRaw={supportYearsRaw} setValueRaw={setSupportYearsRaw} placeholder="e.g. 20" />
                        </FieldShell>
                      </div>
                    </div>

                    <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">2) One-time items (optional)</div>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <FieldShell label="Immediate cash buffer" hint="Funeral + short breathing room for the first months.">
                          <PrefixMoneyInput valueRaw={cashBufferRaw} setValueRaw={setCashBufferRaw} placeholder="e.g. 30,000" />
                        </FieldShell>

                        <FieldShell label="Debts to clear" hint="Loans you don’t want family to inherit.">
                          <PrefixMoneyInput valueRaw={debtsRaw} setValueRaw={setDebtsRaw} placeholder="e.g. 120,000" />
                        </FieldShell>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">3) If you can’t work (Disability / TPD)</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">
                              Some expenses stop — but many essentials still continue.
                            </div>
                          </div>
                          <Badge text="Scenario" />
                        </div>

                        <div className="mt-6 space-y-6">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold">How much of essentials still continue?</div>
                            <div className="text-xs text-[var(--cs-muted)]">
                              If unsure, start around 60%.
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                              <span>Lower</span>
                              <span className="font-semibold text-[var(--cs-text)]">{essentialsStillNeededPct}%</span>
                              <span>Higher</span>
                            </div>
                            <input
                              type="range"
                              min={30}
                              max={100}
                              value={essentialsStillNeededPct}
                              onChange={(e) => setEssentialsStillNeededPct(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold">For how many years?</div>
                            <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                              <span>Short</span>
                              <span className="font-semibold text-[var(--cs-text)]">{tpdYearsCover} years</span>
                              <span>Long</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={Math.max(5, Math.min(40, yearsRemainingHint ? Math.round(yearsRemainingHint) : 30))}
                              value={tpdYearsCover}
                              onChange={(e) => setTpdYearsCover(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">4) If you fall seriously ill (Critical Illness)</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">
                              Simple “time off work” estimate + optional extra buffer.
                            </div>
                          </div>
                          <Badge text="Scenario" />
                        </div>

                        <div className="mt-6 space-y-6">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold">How long might you be off work?</div>
                            <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                              <span>Short</span>
                              <span className="font-semibold text-[var(--cs-text)]">{ciMonthsOff} months</span>
                              <span>Long</span>
                            </div>
                            <input
                              type="range"
                              min={6}
                              max={60}
                              step={6}
                              value={ciMonthsOff}
                              onChange={(e) => setCiMonthsOff(Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="text-xs text-[var(--cs-muted)]">Common starting point: 12–24 months.</div>
                          </div>

                          <FieldShell label="Extra out-of-pocket buffer" hint="Transport, caregiver costs, misc non-covered expenses.">
                            <PrefixMoneyInput valueRaw={ciExtraBufferRaw} setValueRaw={setCiExtraBufferRaw} placeholder="e.g. 20,000" />
                          </FieldShell>
                        </div>
                      </div>
                    </div>

                    {showBenchmarks && outputs && benchmark ? (
                      <div className="rounded-[30px] bg-[color:var(--cs-card)/0.60] border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">Optional benchmarks (MoneySense)</div>
                            <div className="text-sm text-[var(--cs-muted)]">Rules of thumb for reference only. Your situation can differ.</div>
                          </div>
                          <a className="cs-btn cs-btn-ghost" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                            View source
                          </a>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                            <div className="text-xs text-[var(--cs-muted)]">Death & TPD thumb rule</div>
                            <div className="text-xl font-extrabold">${formatMoneySGD(benchmark.deathTpdThumb)}</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">About 9× annual essentials (reference only).</div>
                          </div>
                          <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                            <div className="text-xs text-[var(--cs-muted)]">Critical illness thumb rule</div>
                            <div className="text-xl font-extrabold">${formatMoneySGD(benchmark.ciThumb)}</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">About 4× annual essentials (reference only).</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoExisting}>
                      Next
                    </button>
                  </div>
                </Surface>
              ) : null}

              {step === "existing" ? (
                <Surface className="p-6 sm:p-10">
                  <SectionTitle
                    title="Existing cover (optional)"
                    subtitle="If you know your current coverage, it makes the snapshot clearer. Leave blank if unsure."
                  />

                  <div className="mt-7 grid gap-5 sm:grid-cols-3">
                    <FieldShell label="Death" hint="Total coverage amount (all insurers combined).">
                      <PrefixMoneyInput valueRaw={existingDeathRaw} setValueRaw={setExistingDeathRaw} placeholder="e.g. 500,000" />
                    </FieldShell>

                    <FieldShell label="Disability (TPD)" hint="Use the total TPD sum assured if known.">
                      <PrefixMoneyInput valueRaw={existingTPDRaw} setValueRaw={setExistingTPDRaw} placeholder="e.g. 500,000" />
                    </FieldShell>

                    <FieldShell label="Critical Illness" hint="If you have multiple plans, add them up.">
                      <PrefixMoneyInput valueRaw={existingCIRaw} setValueRaw={setExistingCIRaw} placeholder="e.g. 200,000" />
                    </FieldShell>
                  </div>

                  <div className="mt-7 rounded-[30px] bg-[color:var(--cs-card)/0.60] border border-[var(--cs-border)] p-6">
                    <div className="text-sm font-semibold">Quick guidance</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge text="Blank = $0 (still works)" />
                      <Badge text="Use total coverage amount" />
                      <Badge text="Include all companies" />
                    </div>
                    <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                      If you’re unsure, just leave it blank — you’ll still see a “needs” estimate.
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoResults}>
                      Show results
                    </button>
                  </div>
                </Surface>
              ) : null}

              {step === "results" ? (
                <div className="space-y-6">
                  <Surface className="p-6 sm:p-10">
                    <SectionTitle
                      title="Results snapshot"
                      subtitle="Educational estimate from your inputs. Not advice, and not a product recommendation."
                      right={
                        outputs ? (
                          <div className="rounded-3xl border border-[var(--cs-border)] bg-white/75 px-5 py-3">
                            <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">Total shortfall</div>
                            <div className="text-2xl font-extrabold tracking-tight">${formatMoneySGD(outputs.totalGap)}</div>
                          </div>
                        ) : null
                      }
                    />

                    {!outputs ? (
                      <div className="mt-4 text-sm text-[var(--cs-muted)]">Please complete your inputs first.</div>
                    ) : (
                      <div className="mt-7 grid gap-6 lg:grid-cols-2">
                        <CoverageBars rows={chartRows} />

                        <Surface className="p-6">
                          <div className="text-sm font-semibold">What you keyed in</div>
                          <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                            Essentials (annualised):{" "}
                            <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(outputs.annualEssentials)}</span>{" "}
                            • Support years: <span className="font-semibold text-[var(--cs-text)]">{outputs.supportYears}</span>
                            <br />
                            Disability (TPD): <span className="font-semibold text-[var(--cs-text)]">{essentialsStillNeededPct}%</span>{" "}
                            of essentials for <span className="font-semibold text-[var(--cs-text)]">{tpdYearsCover}</span> years
                            <br />
                            Critical illness: <span className="font-semibold text-[var(--cs-text)]">{ciMonthsOff}</span> months off work
                          </div>

                          {benchmark ? (
                            <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                              Optional benchmark (MoneySense): Death/TPD about{" "}
                              <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(benchmark.deathTpdThumb)}</span>{" "}
                              (9× annual), CI about{" "}
                              <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(benchmark.ciThumb)}</span>{" "}
                              (4× annual).{" "}
                              <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                                Source
                              </a>
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <a className="cs-btn cs-btn-primary" href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}>
                              Request a chat
                            </a>
                            <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("needs")}>
                              Adjust inputs
                            </button>
                          </div>
                        </Surface>
                      </div>
                    )}
                  </Surface>

                  {outputs ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                      <CategorySnapshotCard
                        title="Death"
                        subtitle="Family support + one-time items"
                        accent="purple"
                        icon={
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M12 21s-7-4.35-9.33-9.07C.66 7.64 3.02 4.5 6.5 4.5c1.74 0 3.22.8 4.1 2.02C11.28 5.3 12.76 4.5 14.5 4.5c3.48 0 5.84 3.14 3.83 7.43C19 16.65 12 21 12 21z"
                              stroke="rgba(36,20,48,0.65)"
                              strokeWidth="1.6"
                            />
                          </svg>
                        }
                        need={outputs.deathNeed}
                        existing={outputs.exDeath}
                        gap={outputs.deathGap}
                        why={`Essentials × ${outputs.supportYears} years + optional buffer/debts.`}
                      />

                      <CategorySnapshotCard
                        title="Disability (TPD)"
                        subtitle="If you can’t work — essentials still continue"
                        accent="green"
                        icon={
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M7 11a5 5 0 0 1 10 0v1h2v9H5v-9h2v-1Z"
                              stroke="rgba(36,20,48,0.65)"
                              strokeWidth="1.6"
                            />
                            <path
                              d="M10 11V7a2 2 0 1 1 4 0v4"
                              stroke="rgba(36,20,48,0.65)"
                              strokeWidth="1.6"
                            />
                          </svg>
                        }
                        need={outputs.tpdNeed}
                        existing={outputs.exTPD}
                        gap={outputs.tpdGap}
                        why={`${essentialsStillNeededPct}% of essentials for ${tpdYearsCover} years.`}
                      />

                      <CategorySnapshotCard
                        title="Critical Illness"
                        subtitle="Time off work + buffer"
                        accent="rose"
                        icon={
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M12 21s-7-4.35-9.33-9.07C.66 7.64 3.02 4.5 6.5 4.5c1.74 0 3.22.8 4.1 2.02C11.28 5.3 12.76 4.5 14.5 4.5c3.48 0 5.84 3.14 3.83 7.43C19 16.65 12 21 12 21z"
                              stroke="rgba(36,20,48,0.65)"
                              strokeWidth="1.6"
                            />
                            <path
                              d="M12 8v8M8 12h8"
                              stroke="rgba(36,20,48,0.65)"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        }
                        need={outputs.ciNeed}
                        existing={outputs.exCI}
                        gap={outputs.ciGap}
                        why={`${ciMonthsOff} months off work + optional extra buffer.`}
                      />
                    </div>
                  ) : null}

                  <Surface className="p-6 sm:p-10">
                    <div className="text-sm font-semibold">Important note</div>
                    <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                      General information only. Not financial advice and not a product recommendation. This tool does not account for medical inflation, CPF, underwriting, exclusions, policy definitions, or detailed liabilities.
                    </div>

                    <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:justify-between">
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                        Back
                      </button>
                      <a className="cs-btn cs-btn-ghost" href="/tools">
                        Back to tools
                      </a>
                    </div>
                  </Surface>
                </div>
              ) : null}
            </div>

            <aside className="space-y-5">
              <Surface className="p-6 lg:sticky lg:top-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Live mini-summary</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Updates as you type.</div>
                  </div>
                  <Badge text={outputs ? "Ready" : "Draft"} />
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Mode</div>
                    <div className="font-semibold text-[var(--cs-text)]">{moneyMode === "monthly" ? "Monthly input" : "Annual input"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Essentials (annual)</div>
                    <div className="font-semibold text-[var(--cs-text)]">{annualEssentials > 0 ? `$${formatMoneySGD(annualEssentials)}` : "—"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Support years</div>
                    <div className="font-semibold text-[var(--cs-text)]">{supportYears > 0 ? `${supportYears} years` : "—"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">TPD scenario</div>
                    <div className="font-semibold text-[var(--cs-text)]">{`${essentialsStillNeededPct}% × ${tpdYearsCover}y`}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">CI scenario</div>
                    <div className="font-semibold text-[var(--cs-text)]">{`${ciMonthsOff} months`}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Dependents</div>
                    <div className="font-semibold text-[var(--cs-text)]">{dependents === 3 ? "3+" : String(dependents)}</div>
                  </div>
                </div>

                {outputs ? (
                  <div className="mt-5 rounded-[30px] bg-[color:var(--cs-card)/0.55] border border-[var(--cs-border)] p-5">
                    <div className="text-xs text-[var(--cs-muted)]">Total shortfall</div>
                    <div className="mt-1 text-3xl font-extrabold tracking-tight">${formatMoneySGD(outputs.totalGap)}</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Educational estimate from your inputs.</div>
                    <div className="mt-4 flex flex-col gap-2">
                      <a className="cs-btn cs-btn-primary w-full justify-center" href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}>
                        Request a chat
                      </a>
                      <button type="button" className="cs-btn cs-btn-ghost w-full" onClick={() => setStep("needs")}>
                        Adjust inputs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[30px] bg-[color:var(--cs-card)/0.55] border border-[var(--cs-border)] p-5">
                    <div className="text-xs text-[var(--cs-muted)]">Starter order</div>
                    <ol className="mt-2 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
                      <li>Age + dependents</li>
                      <li>Essentials + support years</li>
                      <li>Set CI months</li>
                      <li>Adjust TPD scenario</li>
                    </ol>
                  </div>
                )}
              </Surface>

              <Surface className="p-6">
                <div className="text-sm font-semibold">Sources</div>
                <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                  Life expectancy hint: Singapore Department of Statistics life tables (2023–2024).{" "}
                  <a className="underline" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                    View
                  </a>
                  <br />
                  Optional benchmarks: MoneySense basic planning guide.{" "}
                  <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              </Surface>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

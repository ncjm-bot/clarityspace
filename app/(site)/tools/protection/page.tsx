"use client";
export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Gender = "male" | "female" | "unspecified";
type MoneyMode = "monthly" | "annual";
type StepKey = "basics" | "scenarios" | "existing" | "results";

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

  why: {
    death: string;
    tpd: string;
    ci: string;
  };
};

const STEP_ORDER: StepKey[] = ["basics", "scenarios", "existing", "results"];

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

function parseIntSafe(raw: string) {
  const n = Number(stripToDigits(raw || ""));
  return Number.isFinite(n) ? n : 0;
}

function parseMoney(v: string) {
  const n = Number(stripToDigits(v));
  return Number.isFinite(n) ? n : 0;
}

function formatMoneySGD(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("en-SG");
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

function Badge(props: { text: string; tone?: "good" | "muted" }) {
  const tone =
    props.tone === "good"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : "border-[var(--cs-border)] bg-white/70 text-[var(--cs-muted)]";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone
      )}
    >
      {props.text}
    </span>
  );
}

function FieldShell(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 min-w-0">
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
    { k: "basics", label: "Basics", sub: "Start here" },
    { k: "scenarios", label: "Scenarios", sub: "Optional sliders" },
    { k: "existing", label: "Existing", sub: "Optional cover" },
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
                active ? "bg-white shadow-[0_14px_40px_rgba(15,43,31,0.10)]" : "hover:bg-white/70",
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

function StatChip(props: { label: string; value: string; tone?: "good" | "risk" | "neutral" }) {
  const tone =
    props.tone === "good"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : props.tone === "risk"
      ? "text-rose-700 bg-rose-50 border-rose-100"
      : "text-[var(--cs-text)] bg-[var(--cs-card)] border-[var(--cs-border)]";

  return (
    <div className={cx("rounded-2xl border px-4 py-3 min-w-0", tone)}>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{props.label}</div>
      <div className="tabular-nums font-extrabold tracking-tight leading-tight text-[clamp(14px,1.55vw,18px)] break-words">
        {props.value}
      </div>
    </div>
  );
}

function CoverageBars(props: { rows: Array<{ name: string; coverage: number; shortfall: number }> }) {
  const fmt = (n: number) => `$${formatMoneySGD(n)}`;

  return (
    <Surface className="p-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="text-sm font-semibold">Coverage vs shortfall</div>
          <div className="text-xs text-[var(--cs-muted)] mt-1">Based on your “Need” estimate.</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--cs-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(16,185,129,0.70)]" />
            Coverage
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(244,63,94,0.70)]" />
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
            <Tooltip
              formatter={(value: any, name: any) => [fmt(Number(value)), String(name)]}
              cursor={{ fill: "rgba(36,20,48,0.06)" }}
            />
            <Bar dataKey="coverage" stackId="a" fill="rgba(16,185,129,0.70)" radius={[10, 10, 10, 10]} />
            <Bar dataKey="shortfall" stackId="a" fill="rgba(244,63,94,0.70)" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}

function computeOutputs(args: {
  annualEssentials: number;
  supportYears: number;
  cashBuffer: number;
  debts: number;

  tpdEnabled: boolean;
  essentialsStillNeededPct: number;
  tpdYearsCover: number;

  ciEnabled: boolean;
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

  const exDeath = Math.max(0, args.exDeath);
  const exTPD = Math.max(0, args.exTPD);
  const exCI = Math.max(0, args.exCI);

  const deathNeed = a * y + cashBuffer + debts;

  const tpdPct = clamp(args.essentialsStillNeededPct, 0, 100) / 100;
  const tpdNeed = args.tpdEnabled ? a * Math.max(0, args.tpdYearsCover) * tpdPct : 0;

  const ciNeed = args.ciEnabled ? (a / 12) * Math.max(0, args.ciMonthsOff) + Math.max(0, args.ciExtra) : 0;

  const deathGap = Math.max(deathNeed - exDeath, 0);
  const tpdGap = Math.max(tpdNeed - exTPD, 0);
  const ciGap = Math.max(ciNeed - exCI, 0);

  const deathWhy =
    `Essentials × ${y} years` + (cashBuffer > 0 ? " + cash buffer" : "") + (debts > 0 ? " + debts" : "");
  const tpdWhy = args.tpdEnabled
    ? `${clamp(args.essentialsStillNeededPct, 0, 100)}% of essentials for ${Math.max(0, args.tpdYearsCover)} years`
    : "Not included (left blank)";
  const ciWhy = args.ciEnabled
    ? `${Math.max(0, args.ciMonthsOff)} months of support` + (Math.max(0, args.ciExtra) > 0 ? " + extra buffer" : "")
    : "Not included (left blank)";

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
    why: { death: deathWhy, tpd: tpdWhy, ci: ciWhy },
  };
}

export default function ProtectionGapTool() {
  const [step, setStep] = useState<StepKey>("basics");
  const [moneyMode, setMoneyMode] = useState<MoneyMode>("monthly");

  const [ageRaw, setAgeRaw] = useState("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [dependents, setDependents] = useState<number>(0);

  const [essentialsRaw, setEssentialsRaw] = useState("");
  const [supportYearsRaw, setSupportYearsRaw] = useState("");

  const [cashBufferRaw, setCashBufferRaw] = useState("");
  const [debtsRaw, setDebtsRaw] = useState("");

  const [tpdEnabled, setTpdEnabled] = useState(false);
  const [essentialsStillNeededPct, setEssentialsStillNeededPct] = useState<number>(60);
  const [tpdYearsCover, setTpdYearsCover] = useState<number>(10);

  const [ciEnabled, setCiEnabled] = useState(false);
  const [ciMonthsOff, setCiMonthsOff] = useState<number>(24);
  const [ciExtraBufferRaw, setCiExtraBufferRaw] = useState<string>("");

  const [existingDeathRaw, setExistingDeathRaw] = useState("");
  const [existingTPDRaw, setExistingTPDRaw] = useState("");
  const [existingCIRaw, setExistingCIRaw] = useState("");

  const [showBenchmarks, setShowBenchmarks] = useState(true);

  const age = useMemo(() => parseIntSafe(ageRaw), [ageRaw]);

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

  const tpdMaxYears = useMemo(() => {
    const cap = yearsRemainingHint ? Math.round(yearsRemainingHint) : 30;
    return clamp(cap, 5, 40);
  }, [yearsRemainingHint]);

  const annualEssentials = useMemo(() => {
    const v = parseMoney(essentialsRaw);
    if (moneyMode === "annual") return Math.max(0, v);
    return Math.max(0, v * 12);
  }, [essentialsRaw, moneyMode]);

  const supportYears = useMemo(() => parseIntSafe(supportYearsRaw), [supportYearsRaw]);

  const outputs = useMemo(() => {
    return computeOutputs({
      annualEssentials,
      supportYears,
      cashBuffer: parseMoney(cashBufferRaw),
      debts: parseMoney(debtsRaw),

      tpdEnabled,
      essentialsStillNeededPct,
      tpdYearsCover,

      ciEnabled,
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
    tpdEnabled,
    essentialsStillNeededPct,
    tpdYearsCover,
    ciEnabled,
    ciMonthsOff,
    ciExtraBufferRaw,
    existingDeathRaw,
    existingTPDRaw,
    existingCIRaw,
  ]);

  const canGoScenarios = useMemo(() => annualEssentials > 0 && supportYears > 0, [annualEssentials, supportYears]);
  const canGoExisting = useMemo(() => canGoScenarios, [canGoScenarios]);
  const canGoResults = useMemo(() => Boolean(outputs), [outputs]);

  const progress = useMemo(() => {
    const idx = STEP_ORDER.indexOf(step);
    return clamp(((idx + 1) / STEP_ORDER.length) * 100, 0, 100);
  }, [step]);

  const chartRows = useMemo(() => {
    if (!outputs) return [];
    const rows = [
      { name: "Death", need: outputs.deathNeed, ex: outputs.exDeath },
      { name: "Disability / TPD", need: outputs.tpdNeed, ex: outputs.exTPD },
      { name: "Critical illness", need: outputs.ciNeed, ex: outputs.exCI },
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

  const summaryText = useMemo(() => {
    if (!outputs) return "";
    const lines = [
      `Protection Gap Check`,
      `Annual essentials: $${formatMoneySGD(outputs.annualEssentials)}`,
      `Total shortfall: $${formatMoneySGD(outputs.totalGap)}`,
      `Death: $${formatMoneySGD(outputs.deathGap)}`,
    ];
    if (tpdEnabled) lines.push(`Disability/TPD: $${formatMoneySGD(outputs.tpdGap)}`);
    if (ciEnabled) lines.push(`Critical illness: $${formatMoneySGD(outputs.ciGap)}`);
    return lines.join(" • ");
  }, [outputs, tpdEnabled, ciEnabled]);

  function canGo(k: StepKey) {
    if (k === "basics") return true;
    if (k === "scenarios") return canGoScenarios;
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

  function resetAll() {
    setStep("basics");
    setMoneyMode("monthly");

    setAgeRaw("");
    setGender("unspecified");
    setDependents(0);

    setEssentialsRaw("");
    setSupportYearsRaw("");

    setCashBufferRaw("");
    setDebtsRaw("");

    setTpdEnabled(false);
    setEssentialsStillNeededPct(60);
    setTpdYearsCover(10);

    setCiEnabled(false);
    setCiMonthsOff(24);
    setCiExtraBufferRaw("");

    setExistingDeathRaw("");
    setExistingTPDRaw("");
    setExistingCIRaw("");

    setShowBenchmarks(true);
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
                    <Badge text="Educational self-check" tone="good" />
                    <Badge text="No product names" />
                    <Badge text="SG context" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Protection Gap Check</h1>
                    <p className="text-[var(--cs-muted)] max-w-2xl leading-relaxed">
                      A quick estimate of “how much money would help” across Death, Disability/TPD, and Critical Illness.
                      General information only — not financial advice and not a recommendation.
                    </p>
                  </div>

                  <StepTabs step={step} canGo={canGo} onGo={(k) => setStep(canGo(k) ? k : step)} />

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={resetAll}>
                      Reset all inputs
                    </button>
                    <a className="cs-btn cs-btn-ghost" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                      Sources
                    </a>
                  </div>
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
                    <div className="text-xs text-[var(--cs-muted)]">Expense input</div>
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
                    <div className="mt-4 rounded-3xl border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-xs text-[var(--cs-muted)]">Estimated total shortfall</div>
                      <div className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
                        ${formatMoneySGD(outputs.totalGap)}
                      </div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Updates as you type.</div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/85 p-3 min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">Death</div>
                          <div className="text-sm font-extrabold tabular-nums break-words">
                            ${formatMoneySGD(outputs.deathGap)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/85 p-3 min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">TPD</div>
                          <div className="text-sm font-extrabold tabular-nums break-words">
                            {tpdEnabled ? `$${formatMoneySGD(outputs.tpdGap)}` : "—"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-[var(--cs-border)] bg-white/85 p-3 min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">CI</div>
                          <div className="text-sm font-extrabold tabular-nums break-words">
                            {ciEnabled ? `$${formatMoneySGD(outputs.ciGap)}` : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-[var(--cs-muted)]">
                        Tip: If a scenario is not included, it won’t affect your results.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-[var(--cs-border)] bg-white/85 p-5">
                      <div className="text-xs text-[var(--cs-muted)]">Start with 2 numbers</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--cs-text)]">
                        Essentials + how many years you want them covered.
                      </div>
                      <div className="mt-3 text-xs text-[var(--cs-muted)] leading-relaxed">
                        Scenarios are optional — you can leave them blank if unsure.
                      </div>
                    </div>
                  )}
                </Surface>
              </div>
            </div>
          </Surface>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <div className="space-y-6">
              {step === "basics" ? (
                <Surface className="p-6 sm:p-10">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg sm:text-xl font-extrabold tracking-tight">Basics</div>
                      <div className="text-sm text-[var(--cs-muted)] leading-relaxed">
                        Two numbers to start: your essentials and how long you want them covered.
                      </div>
                    </div>
                    <a className="cs-btn cs-btn-ghost" href={SOURCES.singstatLifeTables} target="_blank" rel="noreferrer">
                      Sources
                    </a>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-3">
                    <FieldShell label="Age (optional)" hint="Used only for the life expectancy hint below.">
                      <SimpleNumberInput valueRaw={ageRaw} setValueRaw={setAgeRaw} placeholder="e.g. 25" />
                    </FieldShell>

                    <FieldShell
                      label={moneyMode === "monthly" ? "Monthly essential expenses (SGD)" : "Annual essential expenses (SGD)"}
                      hint="Rent/mortgage, bills, food, parents allowance, loan repayments."
                    >
                      <PrefixMoneyInput
                        valueRaw={essentialsRaw}
                        setValueRaw={setEssentialsRaw}
                        placeholder={moneyMode === "monthly" ? "e.g. 3,000" : "e.g. 36,000"}
                      />
                    </FieldShell>

                    <FieldShell
                      label="Support years (Death)"
                      hint="How many years your essentials should be covered for if you’re not around."
                    >
                      <SimpleNumberInput valueRaw={supportYearsRaw} setValueRaw={setSupportYearsRaw} placeholder="e.g. 15" />
                    </FieldShell>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.55] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Gender (optional)</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setGender("male")}
                          className={cx("cs-btn", gender === "male" ? "cs-btn-primary" : "cs-btn-ghost")}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("female")}
                          className={cx("cs-btn", gender === "female" ? "cs-btn-primary" : "cs-btn-ghost")}
                        >
                          Female
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("unspecified")}
                          className={cx("cs-btn", gender === "unspecified" ? "cs-btn-primary" : "cs-btn-ghost")}
                        >
                          Skip
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                      {lifeExpectancyHint ? (
                        <span>
                          Singapore life expectancy at birth (residents, 2024):{" "}
                          <span className="font-semibold text-[var(--cs-text)]">{lifeExpectancyHint}</span>.{" "}
                          {yearsRemainingHint !== null ? (
                            <span>
                              Rough years remaining from your age:{" "}
                              <span className="font-semibold text-[var(--cs-text)]">{yearsRemainingHint}</span>.
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span>Optional hint uses SingStat life tables (2023–2024). Pick a gender + age to show it.</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-[var(--cs-border)] bg-white/70 p-5">
                    <div className="text-sm font-semibold">Plain English</div>
                    <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                      This estimates “how much money would help” if something happens — it’s a rough self-check. Optional
                      parts can be left blank.
                    </div>
                  </div>

                  <div className="mt-7 flex justify-end">
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!canGoScenarios}>
                      Next
                    </button>
                  </div>
                </Surface>
              ) : null}

              {step === "scenarios" ? (
                <Surface className="p-6 sm:p-10">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg sm:text-xl font-extrabold tracking-tight">Scenarios (optional)</div>
                      <div className="text-sm text-[var(--cs-muted)] leading-relaxed">
                        Adjust if you want. If not, leave them off.
                      </div>
                    </div>
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setShowBenchmarks((v) => !v)}>
                      {showBenchmarks ? "Hide benchmarks" : "Show benchmarks"}
                    </button>
                  </div>

                  <div className="mt-7 grid gap-5">
                    <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">One-time items (optional)</div>
                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <FieldShell label="Cash buffer" hint="Short breathing room for the family (first few months).">
                          <PrefixMoneyInput valueRaw={cashBufferRaw} setValueRaw={setCashBufferRaw} placeholder="e.g. 30,000" />
                        </FieldShell>
                        <FieldShell label="Debts to clear" hint="Loans you don’t want others to carry.">
                          <PrefixMoneyInput valueRaw={debtsRaw} setValueRaw={setDebtsRaw} placeholder="e.g. 120,000" />
                        </FieldShell>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Disability / TPD (if you can’t work)</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">
                              How much of essentials still continue, and for how many years.
                            </div>
                          </div>
                          <Badge text={tpdEnabled ? "Included" : "Optional"} tone={tpdEnabled ? "good" : "muted"} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={cx("cs-btn", tpdEnabled ? "cs-btn-primary" : "cs-btn-ghost")}
                            onClick={() => setTpdEnabled(true)}
                          >
                            Include
                          </button>
                          <button
                            type="button"
                            className={cx("cs-btn", !tpdEnabled ? "cs-btn-primary" : "cs-btn-ghost")}
                            onClick={() => setTpdEnabled(false)}
                          >
                            Not now
                          </button>
                        </div>

                        {tpdEnabled ? (
                          <div className="mt-6 space-y-6">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold">Essentials still needed</div>
                              <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                                <span>Lower</span>
                                <span className="font-semibold text-[var(--cs-text)]">{essentialsStillNeededPct}%</span>
                                <span>Higher</span>
                              </div>
                              <input
                                type="range"
                                min={20}
                                max={100}
                                value={essentialsStillNeededPct}
                                onChange={(e) => setEssentialsStillNeededPct(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-xs text-[var(--cs-muted)]">If unsure, 60% is a common starting point.</div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold">Income support years</div>
                              <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                                <span>Short</span>
                                <span className="font-semibold text-[var(--cs-text)]">{tpdYearsCover} years</span>
                                <span>Long</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={tpdMaxYears}
                                value={tpdYearsCover}
                                onChange={(e) => setTpdYearsCover(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-xs text-[var(--cs-muted)]">
                                This is different from Death “support years”. It’s income support if you can’t work.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 text-sm text-[var(--cs-muted)]">Not included — results won’t count this scenario.</div>
                        )}
                      </div>

                      <div className="rounded-[30px] bg-white/70 border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Critical Illness (time off work)</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">
                              How many months of support you’d want during recovery.
                            </div>
                          </div>
                          <Badge text={ciEnabled ? "Included" : "Optional"} tone={ciEnabled ? "good" : "muted"} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={cx("cs-btn", ciEnabled ? "cs-btn-primary" : "cs-btn-ghost")}
                            onClick={() => setCiEnabled(true)}
                          >
                            Include
                          </button>
                          <button
                            type="button"
                            className={cx("cs-btn", !ciEnabled ? "cs-btn-primary" : "cs-btn-ghost")}
                            onClick={() => setCiEnabled(false)}
                          >
                            Not now
                          </button>
                        </div>

                        {ciEnabled ? (
                          <div className="mt-6 space-y-6">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold">Months of support</div>
                              <div className="mt-2 flex items-center justify-between text-xs text-[var(--cs-muted)]">
                                <span>Short</span>
                                <span className="font-semibold text-[var(--cs-text)]">{ciMonthsOff} months</span>
                                <span>Long</span>
                              </div>
                              <input
                                type="range"
                                min={3}
                                max={60}
                                step={3}
                                value={ciMonthsOff}
                                onChange={(e) => setCiMonthsOff(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-xs text-[var(--cs-muted)]">If unsure, 12–24 months is a common range.</div>
                            </div>

                            <FieldShell label="Extra buffer (optional)" hint="Transport, caregiver help, non-covered costs.">
                              <PrefixMoneyInput
                                valueRaw={ciExtraBufferRaw}
                                setValueRaw={setCiExtraBufferRaw}
                                placeholder="e.g. 20,000"
                              />
                            </FieldShell>
                          </div>
                        ) : (
                          <div className="mt-5 text-sm text-[var(--cs-muted)]">Not included — results won’t count this scenario.</div>
                        )}
                      </div>
                    </div>

                    {showBenchmarks && outputs && benchmark ? (
                      <div className="rounded-[30px] bg-[color:var(--cs-card)/0.60] border border-[var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">Optional benchmarks (MoneySense)</div>
                            <div className="text-sm text-[var(--cs-muted)]">Rules of thumb only — your situation can differ.</div>
                          </div>
                          <a className="cs-btn cs-btn-ghost" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                            View source
                          </a>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                            <div className="text-xs text-[var(--cs-muted)]">Death & TPD thumb rule</div>
                            <div className="text-xl font-extrabold tabular-nums">${formatMoneySGD(benchmark.deathTpdThumb)}</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">About 9× annual essentials.</div>
                          </div>
                          <div className="rounded-3xl bg-white/75 border border-[var(--cs-border)] p-5">
                            <div className="text-xs text-[var(--cs-muted)]">Critical illness thumb rule</div>
                            <div className="text-xl font-extrabold tabular-nums">${formatMoneySGD(benchmark.ciThumb)}</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">About 4× annual essentials.</div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[28px] border border-[var(--cs-border)] bg-white/70 p-5">
                      <div className="text-sm font-semibold">Quick tip</div>
                      <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                        If you’re unsure, leave scenarios off and get a first-pass result. You can refine later.
                      </div>
                    </div>
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
                  <div className="space-y-1">
                    <div className="text-lg sm:text-xl font-extrabold tracking-tight">Existing cover (optional)</div>
                    <div className="text-sm text-[var(--cs-muted)] leading-relaxed">
                      If you know your coverage amounts, add them here. If not, leave blank.
                    </div>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-3">
                    <FieldShell label="Death coverage" hint="Total coverage (all insurers combined).">
                      <PrefixMoneyInput valueRaw={existingDeathRaw} setValueRaw={setExistingDeathRaw} placeholder="e.g. 250,000" />
                    </FieldShell>

                    <FieldShell label="Disability / TPD coverage" hint="Total TPD sum assured (if you know it).">
                      <PrefixMoneyInput valueRaw={existingTPDRaw} setValueRaw={setExistingTPDRaw} placeholder="e.g. 250,000" />
                    </FieldShell>

                    <FieldShell label="Critical illness coverage" hint="Add up across plans if you have more than one.">
                      <PrefixMoneyInput valueRaw={existingCIRaw} setValueRaw={setExistingCIRaw} placeholder="e.g. 150,000" />
                    </FieldShell>
                  </div>

                  <div className="mt-7 rounded-[28px] border border-[var(--cs-border)] bg-white/70 p-5">
                    <div className="text-sm font-semibold">Quick guidance</div>
                    <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                      Blank = treat as $0. Use totals and include all companies. You’ll still get a “needs estimate” even if
                      you leave everything blank here.
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
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div className="space-y-1">
                        <div className="text-lg sm:text-xl font-extrabold tracking-tight">Results snapshot</div>
                        <div className="text-sm text-[var(--cs-muted)] leading-relaxed">
                          Educational estimate from your inputs. Not advice, and not a product recommendation.
                        </div>
                      </div>

                      {outputs ? (
                        <div className="rounded-3xl border border-[var(--cs-border)] bg-white/80 px-5 py-3">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">Total shortfall</div>
                          <div className="text-2xl font-extrabold tracking-tight tabular-nums">
                            ${formatMoneySGD(outputs.totalGap)}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {!outputs ? (
                      <div className="mt-4 text-sm text-[var(--cs-muted)]">Please fill in essentials + Death support years first.</div>
                    ) : (
                      <div className="mt-7 grid gap-6 lg:grid-cols-2">
                        <CoverageBars rows={chartRows} />

                        <Surface className="p-6">
                          <div className="text-sm font-semibold">Your inputs (simple)</div>

                          <div className="mt-3 grid gap-3">
                            <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                              <div className="text-xs text-[var(--cs-muted)]">Essentials (annual)</div>
                              <div className="text-base font-extrabold tabular-nums">${formatMoneySGD(outputs.annualEssentials)}</div>
                              <div className="text-xs text-[var(--cs-muted)] mt-1">Death support: {outputs.supportYears} years</div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                                <div className="text-xs text-[var(--cs-muted)]">Disability / TPD</div>
                                <div className="text-sm font-semibold break-words">
                                  {tpdEnabled ? `${essentialsStillNeededPct}% for ${tpdYearsCover} years` : "Not included"}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                                <div className="text-xs text-[var(--cs-muted)]">Critical illness</div>
                                <div className="text-sm font-semibold break-words">
                                  {ciEnabled ? `${ciMonthsOff} months` : "Not included"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {benchmark ? (
                            <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                              Optional benchmarks (MoneySense): Death/TPD about{" "}
                              <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(benchmark.deathTpdThumb)}</span>, CI about{" "}
                              <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(benchmark.ciThumb)}</span>.{" "}
                              <a className="underline" href={SOURCES.moneysenseBfpg} target="_blank" rel="noreferrer">
                                Source
                              </a>
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <a className="cs-btn cs-btn-primary" href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}>
                              Request a chat
                            </a>
                            <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("basics")}>
                              Adjust inputs
                            </button>
                          </div>
                        </Surface>
                      </div>
                    )}
                  </Surface>

                  {outputs ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                      <Surface className="p-6 bg-gradient-to-br from-white via-white to-[rgba(108,92,231,0.10)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-extrabold tracking-tight">Death</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">Family support + one-time items</div>
                          </div>
                          <Badge text="Summary" />
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <StatChip label="Need" value={`$${formatMoneySGD(outputs.deathNeed)}`} />
                          <StatChip label="Coverage" value={`$${formatMoneySGD(outputs.exDeath)}`} tone="good" />
                          <StatChip
                            label="Shortfall"
                            value={`$${formatMoneySGD(outputs.deathGap)}`}
                            tone={outputs.deathGap > 0 ? "risk" : "good"}
                          />
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">How it’s estimated</div>
                          <div className="mt-1 text-sm font-semibold break-words">{outputs.why.death}</div>
                        </div>
                      </Surface>

                      <Surface className="p-6 bg-gradient-to-br from-white via-white to-[rgba(0,184,148,0.10)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-extrabold tracking-tight">Disability / TPD</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">If you can’t work</div>
                          </div>
                          <Badge text={tpdEnabled ? "Included" : "Optional"} tone={tpdEnabled ? "good" : "muted"} />
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <StatChip label="Need" value={`$${formatMoneySGD(outputs.tpdNeed)}`} />
                          <StatChip label="Coverage" value={`$${formatMoneySGD(outputs.exTPD)}`} tone="good" />
                          <StatChip
                            label="Shortfall"
                            value={`$${formatMoneySGD(outputs.tpdGap)}`}
                            tone={outputs.tpdGap > 0 ? "risk" : "good"}
                          />
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">How it’s estimated</div>
                          <div className="mt-1 text-sm font-semibold break-words">{outputs.why.tpd}</div>
                        </div>
                      </Surface>

                      <Surface className="p-6 bg-gradient-to-br from-white via-white to-[rgba(244,63,94,0.10)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-extrabold tracking-tight">Critical illness</div>
                            <div className="text-xs text-[var(--cs-muted)] mt-1">Time off work + buffer</div>
                          </div>
                          <Badge text={ciEnabled ? "Included" : "Optional"} tone={ciEnabled ? "good" : "muted"} />
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <StatChip label="Need" value={`$${formatMoneySGD(outputs.ciNeed)}`} />
                          <StatChip label="Coverage" value={`$${formatMoneySGD(outputs.exCI)}`} tone="good" />
                          <StatChip
                            label="Shortfall"
                            value={`$${formatMoneySGD(outputs.ciGap)}`}
                            tone={outputs.ciGap > 0 ? "risk" : "good"}
                          />
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                          <div className="text-[10px] uppercase tracking-wide text-[var(--cs-muted)]">How it’s estimated</div>
                          <div className="mt-1 text-sm font-semibold break-words">{outputs.why.ci}</div>
                        </div>
                      </Surface>
                    </div>
                  ) : null}

                  <Surface className="p-6 sm:p-10">
                    <div className="text-sm font-semibold">Important note</div>
                    <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                      General information only. Not financial advice and not a product recommendation. This tool does not
                      account for medical inflation, CPF, underwriting, exclusions, policy definitions, or detailed liabilities.
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
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Keeps it simple.</div>
                  </div>
                  <Badge text={outputs ? "Ready" : "Draft"} />
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Essentials (annual)</div>
                    <div className="font-semibold text-[var(--cs-text)] tabular-nums">
                      {annualEssentials > 0 ? `$${formatMoneySGD(annualEssentials)}` : "—"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Death support years</div>
                    <div className="font-semibold text-[var(--cs-text)]">{supportYears > 0 ? `${supportYears} years` : "—"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">TPD scenario</div>
                    <div className="font-semibold text-[var(--cs-text)]">{tpdEnabled ? `${essentialsStillNeededPct}% × ${tpdYearsCover}y` : "Not included"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">CI scenario</div>
                    <div className="font-semibold text-[var(--cs-text)]">{ciEnabled ? `${ciMonthsOff} months` : "Not included"}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[var(--cs-muted)]">Dependents</div>
                    <div className="font-semibold text-[var(--cs-text)]">{dependents === 3 ? "3+" : String(dependents)}</div>
                  </div>
                </div>

                {outputs ? (
                  <div className="mt-5 rounded-[30px] bg-[color:var(--cs-card)/0.55] border border-[var(--cs-border)] p-5">
                    <div className="text-xs text-[var(--cs-muted)]">Total shortfall</div>
                    <div className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">${formatMoneySGD(outputs.totalGap)}</div>
                    <div className="mt-4 flex flex-col gap-2">
                      <a className="cs-btn cs-btn-primary w-full justify-center" href={`/contact?tool=protection&summary=${encodeURIComponent(summaryText)}`}>
                        Request a chat
                      </a>
                      <button type="button" className="cs-btn cs-btn-ghost w-full" onClick={() => setStep("basics")}>
                        Adjust inputs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[30px] bg-[color:var(--cs-card)/0.55] border border-[var(--cs-border)] p-5">
                    <div className="text-xs text-[var(--cs-muted)]">Starter order</div>
                    <ol className="mt-2 list-decimal pl-5 text-sm text-[var(--cs-muted)] space-y-1">
                      <li>Essentials</li>
                      <li>Death support years</li>
                      <li>Optional scenarios</li>
                      <li>Existing cover</li>
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

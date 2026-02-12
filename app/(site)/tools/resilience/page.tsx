"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StepKey = "start" | "runway" | "shock" | "notes" | "snapshot";
type IncomeStability = "stable" | "irregular";
type ExpenseMode = "monthly" | "annual";

const STEP_ORDER: StepKey[] = ["start", "runway", "shock", "notes", "snapshot"];

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

function pct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return clamp(n, 0, 100);
}

function encodeQuery(obj: Record<string, string>) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) sp.set(k, v);
  });
  return sp.toString();
}

function stepTitle(s: StepKey) {
  if (s === "start") return "Start";
  if (s === "runway") return "Runway";
  if (s === "shock") return "Shock test";
  if (s === "notes") return "Notes";
  return "Snapshot";
}

function stepSub(s: StepKey) {
  if (s === "start") return "Quick setup";
  if (s === "runway") return "Months covered";
  if (s === "shock") return "Income drops";
  if (s === "notes") return "Optional";
  return "Results";
}

function runwayTag(months: number, stability: IncomeStability) {
  const target = stability === "irregular" ? 12 : 6;
  if (months <= 0.5) return { label: "FRAGILE", tone: "cs-badge cs-badge-risk" as const };
  if (months < 3) return { label: "BUILDING", tone: "cs-badge cs-badge-warn" as const };
  if (months < target) return { label: "DECENT", tone: "cs-badge cs-badge-good" as const };
  return { label: "STRONG", tone: "cs-badge cs-badge-good" as const };
}

function nextMilestone(months: number, stability: IncomeStability) {
  const target = stability === "irregular" ? 12 : 6;
  if (months < 1) return 1;
  if (months < 3) return 3;
  if (months < target) return target;
  if (months < 12) return 12;
  return 12;
}

function Pill(props: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border border-[var(--cs-border)] bg-white/70">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--cs-accent,#6C5CE7)]" />
      {props.text}
    </span>
  );
}

function CurrencyField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const display = props.value ? formatMoneySGD(parseMoney(props.value)) : "";
  return (
    <label className="space-y-1 block">
      <div className="text-sm font-semibold">{props.label}</div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--cs-muted)]">$</div>
        <input
          inputMode="numeric"
          className="cs-input pl-7"
          value={display}
          onChange={(e) => props.onChange(stripToDigits(e.target.value))}
          placeholder={props.placeholder}
        />
      </div>
      {props.hint ? <div className="text-xs text-[var(--cs-muted)] leading-relaxed">{props.hint}</div> : null}
    </label>
  );
}

function MiniCard(props: { title: string; value: string; sub?: string; tone?: "soft" | "danger" | "good" }) {
  const bg =
    props.tone === "danger"
      ? "bg-rose-50"
      : props.tone === "good"
      ? "bg-emerald-50"
      : "bg-[color:var(--cs-card)/0.55]";
  const border =
    props.tone === "danger"
      ? "border-rose-100"
      : props.tone === "good"
      ? "border-emerald-100"
      : "border-[color:var(--cs-border)]";

  return (
    <div className={cx("rounded-[22px] border p-4", bg, border)}>
      <div className="text-xs text-[var(--cs-muted)]">{props.title}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-[var(--cs-muted)]">{props.sub}</div> : null}
    </div>
  );
}

function Gauge(props: { label: string; valueText: string; pct: number; sub?: string }) {
  return (
    <div className="rounded-[26px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{props.label}</div>
          {props.sub ? <div className="text-xs text-[var(--cs-muted)] mt-1">{props.sub}</div> : null}
        </div>
        <div className="text-2xl font-bold tracking-tight">{props.valueText}</div>
      </div>

      <div className="mt-4 h-3 rounded-full bg-[color:var(--cs-card)/0.9] border border-[color:var(--cs-border)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct(props.pct)}%`,
            background: "linear-gradient(90deg, rgba(108,92,231,0.95), rgba(0,184,148,0.85))",
            transition: "width 450ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </div>
      <div className="mt-2 text-xs text-[var(--cs-muted)]">Visual guide only.</div>
    </div>
  );
}

function FancyIcon() {
  return (
    <div className="h-14 w-14 rounded-[22px] border border-[color:var(--cs-border)] bg-white/70 backdrop-blur flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.06)] relative overflow-hidden">
      <div
        className="absolute -inset-10 blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(108,92,231,0.40), transparent 55%), radial-gradient(circle at 70% 70%, rgba(0,184,148,0.34), transparent 55%)",
        }}
      />
      <div className="relative">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7.5 10.5V8.8C7.5 6.1 9.7 4 12.4 4h.2c2.7 0 4.9 2.1 4.9 4.8v1.7"
            stroke="rgba(36,20,48,0.70)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M6.8 10.5h10.4c1 0 1.8.8 1.8 1.8v6.1c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-6.1c0-1 .8-1.8 1.8-1.8Z"
            stroke="rgba(36,20,48,0.70)"
            strokeWidth="1.6"
          />
          <path
            d="M12 14v2.4"
            stroke="rgba(108,92,231,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function EmergencyBufferTool() {
  const sp = useSearchParams();

  const [step, setStep] = useState<StepKey>("start");

  const [incomeStability, setIncomeStability] = useState<IncomeStability>("stable");
  const [expenseMode, setExpenseMode] = useState<ExpenseMode>("monthly");

  const [essentialsRaw, setEssentialsRaw] = useState("");
  const [liquidSavingsRaw, setLiquidSavingsRaw] = useState("");

  const [shockMonths, setShockMonths] = useState<number>(6);
  const [incomeDropPct, setIncomeDropPct] = useState<number>(50);

  const [userNotes, setUserNotes] = useState<string>("");

  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    const qStep = (sp.get("s") || "") as StepKey;
    const qStab = (sp.get("stab") || "") as IncomeStability;
    const qMode = (sp.get("mode") || "") as ExpenseMode;

    const qE = sp.get("e") || "";
    const qSv = sp.get("sv") || "";
    const qSm = sp.get("sm") || "";
    const qDrop = sp.get("drop") || "";
    const qNotes = sp.get("note") || "";

    if (qStab === "stable" || qStab === "irregular") setIncomeStability(qStab);
    if (qMode === "monthly" || qMode === "annual") setExpenseMode(qMode);

    if (qE) setEssentialsRaw(stripToDigits(qE));
    if (qSv) setLiquidSavingsRaw(stripToDigits(qSv));

    const smN = Number(stripToDigits(qSm));
    if (Number.isFinite(smN) && smN >= 3 && smN <= 12) setShockMonths(smN);

    const dropN = Number(stripToDigits(qDrop));
    if (Number.isFinite(dropN) && dropN >= 10 && dropN <= 90) setIncomeDropPct(dropN);

    if (qNotes) setUserNotes(qNotes);

    if (qStep && STEP_ORDER.includes(qStep)) setStep(qStep);
  }, [sp]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const essentialsValue = useMemo(() => Math.max(0, parseMoney(essentialsRaw)), [essentialsRaw]);
  const liquidSavings = useMemo(() => Math.max(0, parseMoney(liquidSavingsRaw)), [liquidSavingsRaw]);

  const essentialsMonthly = useMemo(() => {
    if (essentialsValue <= 0) return 0;
    return expenseMode === "monthly" ? essentialsValue : essentialsValue / 12;
  }, [essentialsValue, expenseMode]);

  const bufferTargetMonths = useMemo(() => (incomeStability === "irregular" ? 12 : 6), [incomeStability]);
  const bufferTargetAmount = useMemo(() => essentialsMonthly * bufferTargetMonths, [essentialsMonthly, bufferTargetMonths]);

  const runwayMonths = useMemo(() => {
    if (essentialsMonthly <= 0) return 0;
    return round1(liquidSavings / essentialsMonthly);
  }, [essentialsMonthly, liquidSavings]);

  const runwayProgressPct = useMemo(() => {
    if (bufferTargetAmount <= 0) return 0;
    return (liquidSavings / bufferTargetAmount) * 100;
  }, [liquidSavings, bufferTargetAmount]);

  const shockNeed = useMemo(() => {
    const shortfallMonthly = essentialsMonthly * (clamp(incomeDropPct, 0, 100) / 100);
    return shortfallMonthly * clamp(shockMonths, 0, 24);
  }, [essentialsMonthly, incomeDropPct, shockMonths]);

  const shockGap = useMemo(() => Math.max(shockNeed - liquidSavings, 0), [shockNeed, liquidSavings]);

  const shockSurplus = useMemo(() => Math.max(liquidSavings - shockNeed, 0), [liquidSavings, shockNeed]);

  const surplusOrShortfall = useMemo(() => {
    if (shockGap > 0) return { kind: "Shortfall", amount: shockGap };
    return { kind: "Surplus", amount: shockSurplus };
  }, [shockGap, shockSurplus]);

  const milestone = useMemo(() => nextMilestone(runwayMonths, incomeStability), [runwayMonths, incomeStability]);
  const milestoneAmount = useMemo(() => essentialsMonthly * milestone, [essentialsMonthly, milestone]);

  const tag = useMemo(() => runwayTag(runwayMonths, incomeStability), [runwayMonths, incomeStability]);

  const stepValid = useMemo(() => {
    const startOk = true;
    const runwayOk = essentialsMonthly > 0 && liquidSavings >= 0;
    const shockOk = runwayOk && shockMonths >= 3 && shockMonths <= 12 && incomeDropPct >= 10 && incomeDropPct <= 90;
    const notesOk = true;
    const snapshotOk = runwayOk;
    return {
      start: startOk,
      runway: runwayOk,
      shock: shockOk,
      notes: notesOk,
      snapshot: snapshotOk,
    };
  }, [essentialsMonthly, liquidSavings, shockMonths, incomeDropPct]);

  const canEnterStep = useMemo(() => {
    const can: Record<StepKey, boolean> = {
      start: true,
      runway: stepValid.start,
      shock: stepValid.runway,
      notes: stepValid.shock,
      snapshot: stepValid.runway,
    };
    return can;
  }, [stepValid]);

  useEffect(() => {
    if (!canEnterStep[step]) {
      if (step === "runway") setStep("start");
      else if (step === "shock") setStep("runway");
      else if (step === "notes") setStep("shock");
      else if (step === "snapshot") setStep("notes");
    }
  }, [step, canEnterStep]);

  const progress = useMemo(() => {
    const idx = STEP_ORDER.indexOf(step);
    return clamp((idx / (STEP_ORDER.length - 1)) * 100, 0, 100);
  }, [step]);

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    if (!canEnterStep[next]) return;
    if (step === "runway" && !stepValid.runway) return;
    if (step === "shock" && !stepValid.shock) return;
    setStep(next);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    const prev = STEP_ORDER[Math.max(idx - 1, 0)];
    setStep(prev);
  }

  function saveLink() {
    const q = encodeQuery({
      s: step,
      stab: incomeStability,
      mode: expenseMode,
      e: essentialsRaw || "",
      sv: liquidSavingsRaw || "",
      sm: String(shockMonths),
      drop: String(incomeDropPct),
      note: userNotes || "",
    });

    const url = `${window.location.origin}/tools/resilience?${q}`;
    navigator.clipboard.writeText(url).then(
      () => setToast("Link copied ✅"),
      () => setToast("Couldn’t copy — try manually")
    );
  }

  const shockSummaryLine = useMemo(() => {
    if (!stepValid.runway) return "Enter essentials + savings to see shock result.";
    const shortfallMonthly = essentialsMonthly * (incomeDropPct / 100);
    return `If income drops ${incomeDropPct}%, we assume you need to cover about $${formatMoneySGD(shortfallMonthly)} per month for ${shockMonths} months.`;
  }, [stepValid.runway, essentialsMonthly, incomeDropPct, shockMonths]);

  const contactSummary = useMemo(() => {
    const expLabel = expenseMode === "monthly" ? "Monthly" : "Annual";
    const expDisplay = essentialsValue > 0 ? `$${formatMoneySGD(essentialsValue)}` : "—";
    const savingsDisplay = `$${formatMoneySGD(liquidSavings)}`;
    const ssLabel = surplusOrShortfall.kind;
    const ssAmount = `$${formatMoneySGD(surplusOrShortfall.amount)}`;
    const note = userNotes?.trim() ? userNotes.trim() : "—";

    return [
      `Emergency Buffer Tool`,
      `${expLabel} Expenses: ${expDisplay}`,
      `Liquid Savings: ${savingsDisplay}`,
      `Surplus/Shortfall Amount: ${ssLabel} ${ssAmount}`,
      `Anything you want to mention for me to take note: ${note}`,
    ].join("\n");
  }, [expenseMode, essentialsValue, liquidSavings, surplusOrShortfall, userNotes]);

  const contactHref = useMemo(() => {
    const tool = "emergency-buffer";
    return `/contact?tool=${encodeURIComponent(tool)}&summary=${encodeURIComponent(contactSummary)}`;
  }, [contactSummary]);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-transparent">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14 py-6 space-y-5">
        <div className="mx-auto w-full max-w-[1680px] space-y-5">
          <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
            ← Back to tools
          </a>

          <div
            className={cx(
              "relative overflow-hidden rounded-[34px] border border-[color:var(--cs-border)]",
              "bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.65]",
              "shadow-[0_18px_45px_rgba(0,0,0,0.08)]"
            )}
          >
            <div className="absolute -top-48 -left-48 h-[620px] w-[620px] rounded-full bg-[rgba(108,92,231,0.14)] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-[rgba(0,184,148,0.12)] blur-3xl animate-[pulse_7s_ease-in-out_infinite]" />
            <div className="absolute -top-28 -right-28 h-60 w-60 rounded-full bg-[rgba(255,159,67,0.10)] blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

            <div className="relative p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] 2xl:grid-cols-[minmax(0,1fr)_520px] lg:items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <FancyIcon />
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <Pill text="Runway estimate" />
                        <Pill text="Shock scenario" />
                        <Pill text="Simple next step" />
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Emergency Buffer Check</h1>
                      <p className="text-[var(--cs-muted)] max-w-2xl leading-relaxed">
                        See how many months of runway you have if income stops — and what a safer buffer could look like.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="cs-badge">General info only</span>
                    {stepValid.runway ? <span className={tag.tone}>{tag.label}</span> : <span className="cs-badge">Draft</span>}
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-[var(--cs-muted)]">Results are estimates</div>

                    <button
                      type="button"
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border",
                        "border-[color:var(--cs-border)] bg-white/75 hover:bg-white",
                        "shadow-[0_10px_25px_rgba(0,0,0,0.06)]"
                      )}
                      onClick={() => setStep("runway")}
                    >
                      Start check <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  <div className="mt-2 rounded-[26px] bg-white/60 border border-[color:var(--cs-border)] p-3">
                    <div className="grid gap-2 sm:grid-cols-5">
                      {STEP_ORDER.map((k) => {
                        const idx = STEP_ORDER.indexOf(step);
                        const i = STEP_ORDER.indexOf(k);
                        const active = k === step;

                        const done =
                          (k === "start" && stepValid.start && idx > i) ||
                          (k === "runway" && stepValid.runway && idx > i) ||
                          (k === "shock" && stepValid.shock && idx > i) ||
                          (k === "notes" && stepValid.notes && idx > i);

                        const locked = !canEnterStep[k];

                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              if (!locked) setStep(k);
                            }}
                            className={cx(
                              "text-left rounded-2xl px-3 py-3 transition",
                              active ? "bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)]" : "hover:bg-white/70",
                              locked ? "opacity-40 cursor-not-allowed" : ""
                            )}
                            disabled={locked}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">{stepTitle(k)}</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-0.5">{stepSub(k)}</div>
                              </div>
                              <div
                                className={cx(
                                  "h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0",
                                  active
                                    ? "bg-[color:var(--cs-card)/0.75] border-[color:var(--cs-border)]"
                                    : done
                                    ? "bg-emerald-50 border-emerald-100"
                                    : "bg-white/60 border-[color:var(--cs-border)]"
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
                </div>

                <div className="w-full">
                  <div className="rounded-[26px] bg-white/70 backdrop-blur border border-[color:var(--cs-border)] shadow-[0_10px_25px_rgba(0,0,0,0.06)] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Progress</div>
                      <div className="text-xs text-[var(--cs-muted)]">{Math.round(progress)}%</div>
                    </div>

                    <div className="mt-3 h-2.5 rounded-full bg-[color:var(--cs-card)/0.85] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          transition: "width 450ms cubic-bezier(.2,.8,.2,1)",
                          background: "linear-gradient(90deg, rgba(108,92,231,0.95), rgba(0,184,148,0.85))",
                        }}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-[color:var(--cs-card)/0.5] border border-[color:var(--cs-border)] p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Quick status</div>
                        <span className={cx("text-xs font-semibold", stepValid.runway ? "text-emerald-700" : "text-amber-700")}>
                          {stepValid.runway ? "Ready ✓" : "Needs inputs"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                        {stepValid.runway ? "You can jump to Snapshot anytime. Shock test and notes are optional refinements." : "Fill expenses + savings first."}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="cs-btn cs-btn-ghost" onClick={saveLink}>
                        Save / share link
                      </button>
                      <a className="cs-btn cs-btn-ghost" href="/tools">
                        Back to tools
                      </a>
                    </div>

                    {toast ? (
                      <div className="mt-4 rounded-2xl bg-white/70 border border-[color:var(--cs-border)] px-4 py-3 text-sm font-semibold">
                        {toast}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_460px] 2xl:grid-cols-[minmax(0,1fr)_520px] lg:items-start">
            <div className="space-y-5">
              {step === "start" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="space-y-1">
                    <div className="text-lg font-bold tracking-tight">Start</div>
                    <div className="text-sm text-[var(--cs-muted)]">Pick input style + income stability. That’s it.</div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-5">
                      <div className="text-sm font-semibold">Expense input style</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">This affects how your summary is phrased.</div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className={cx("cs-btn w-full", expenseMode === "monthly" ? "cs-btn-primary" : "cs-btn-ghost")}
                          onClick={() => setExpenseMode("monthly")}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          className={cx("cs-btn w-full", expenseMode === "annual" ? "cs-btn-primary" : "cs-btn-ghost")}
                          onClick={() => setExpenseMode("annual")}
                        >
                          Annual
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-5">
                      <div className="text-sm font-semibold">Income stability</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Irregular income uses a higher runway target.</div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className={cx("cs-btn w-full", incomeStability === "stable" ? "cs-btn-primary" : "cs-btn-ghost")}
                          onClick={() => setIncomeStability("stable")}
                        >
                          Stable
                        </button>
                        <button
                          type="button"
                          className={cx("cs-btn w-full", incomeStability === "irregular" ? "cs-btn-primary" : "cs-btn-ghost")}
                          onClick={() => setIncomeStability("irregular")}
                        >
                          Irregular
                        </button>
                      </div>

                      <div className="mt-3 rounded-2xl bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-4">
                        <div className="text-xs text-[var(--cs-muted)]">Target runway</div>
                        <div className="text-sm font-semibold mt-1">{incomeStability === "irregular" ? "12 months" : "6 months"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext}>
                      Next →
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "runway" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Runway</div>
                      <div className="text-sm text-[var(--cs-muted)]">How long savings can cover essentials.</div>
                    </div>
                    {stepValid.runway ? <span className={tag.tone}>{tag.label}</span> : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <CurrencyField
                      label={`${expenseMode === "monthly" ? "Monthly" : "Annual"} expenses (SGD)`}
                      value={essentialsRaw}
                      onChange={setEssentialsRaw}
                      placeholder={expenseMode === "monthly" ? "e.g. 2,800" : "e.g. 33,600"}
                      hint="Bare minimum you must pay (no wants)."
                    />

                    <CurrencyField
                      label="Liquid savings (SGD)"
                      value={liquidSavingsRaw}
                      onChange={setLiquidSavingsRaw}
                      placeholder="e.g. 12,000"
                      hint="Money you can access fast (bank/cash)."
                    />
                  </div>

                  {stepValid.runway ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      <Gauge
                        label="Your runway"
                        valueText={`${runwayMonths} months`}
                        pct={(runwayMonths / Math.max(1, bufferTargetMonths)) * 100}
                        sub={`Target used: ${bufferTargetMonths} months (${incomeStability === "irregular" ? "irregular" : "stable"} income).`}
                      />

                      <div className="rounded-[26px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
                        <div className="text-sm font-semibold">Milestone tracker</div>
                        <div className="text-xs text-[var(--cs-muted)] mt-1">This makes progress feel “real”.</div>

                        <div className="mt-4 grid gap-3">
                          <MiniCard
                            title="Next milestone"
                            value={`${milestone} months`}
                            sub={essentialsMonthly > 0 ? `About $${formatMoneySGD(milestoneAmount)} based on your expenses.` : "—"}
                            tone="soft"
                          />
                          <MiniCard
                            title={incomeStability === "irregular" ? "12-month target" : "6-month target"}
                            value={essentialsMonthly > 0 ? `$${formatMoneySGD(bufferTargetAmount)}` : "—"}
                            sub="Guide only — for runway comfort."
                            tone="soft"
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {[1, 3, bufferTargetMonths, 12].map((m) => {
                            const hit = runwayMonths >= m;
                            return (
                              <div
                                key={m}
                                className={cx(
                                  "rounded-2xl border px-3 py-2 text-center",
                                  hit ? "bg-emerald-50 border-emerald-100" : "bg-white/70 border-[color:var(--cs-border)]"
                                )}
                              >
                                <div className="text-xs text-[var(--cs-muted)]">{m}m</div>
                                <div className="text-sm font-semibold">{hit ? "✓" : "○"}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">Enter expenses to start</div>
                      <div className="mt-2 text-xs text-[var(--cs-muted)]">Savings can be $0 — tool still works.</div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!stepValid.runway}>
                      Next →
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "shock" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Shock test</div>
                      <div className="text-sm text-[var(--cs-muted)]">Simple scenario: income drops, expenses keep running.</div>
                    </div>
                    <span className="cs-badge">Scenario</span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">Duration</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">How many months does income drop last?</div>
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          type="range"
                          min={3}
                          max={12}
                          step={1}
                          value={shockMonths}
                          onChange={(e) => setShockMonths(Number(e.target.value))}
                          className="w-full"
                        />
                        <span className="cs-badge">{shockMonths}m</span>
                      </div>
                    </div>

                    <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                      <div className="text-sm font-semibold">Income drop</div>
                      <div className="text-xs text-[var(--cs-muted)] mt-1">Example: 50% drop means you cover about half your expenses.</div>
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          type="range"
                          min={10}
                          max={90}
                          step={5}
                          value={incomeDropPct}
                          onChange={(e) => setIncomeDropPct(Number(e.target.value))}
                          className="w-full"
                        />
                        <span className="cs-badge">{incomeDropPct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                    <div className="text-sm font-semibold">What this means</div>
                    <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">{shockSummaryLine}</div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <MiniCard
                      title="Cash needed for shock"
                      value={`$${formatMoneySGD(shockNeed)}`}
                      sub="Estimated shortfall to cover (from your inputs)."
                      tone="soft"
                    />
                    <MiniCard
                      title="Surplus / Shortfall"
                      value={`${surplusOrShortfall.kind === "Shortfall" ? "-" : "+"}$${formatMoneySGD(surplusOrShortfall.amount)}`}
                      sub={surplusOrShortfall.kind === "Shortfall" ? "You may run out in this scenario." : "Your savings covers this scenario."}
                      tone={surplusOrShortfall.kind === "Shortfall" ? "danger" : "good"}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext} disabled={!stepValid.shock}>
                      Next →
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "notes" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="space-y-1">
                    <div className="text-lg font-bold tracking-tight">Notes (optional)</div>
                    <div className="text-sm text-[var(--cs-muted)]">Anything you want me to take note before I reach out.</div>
                  </div>

                  <div className="rounded-[26px] bg-white/70 border border-[color:var(--cs-border)] p-6">
                    <div className="text-sm font-semibold">Anything you want to mention</div>
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Example: upcoming major expenses, job change, family commitments, debt, etc.</div>
                    <textarea
                      className="mt-4 w-full rounded-2xl border border-[color:var(--cs-border)] bg-white/75 p-4 text-sm outline-none focus:ring-2 focus:ring-[rgba(108,92,231,0.25)]"
                      rows={5}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Type here..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="cs-btn cs-btn-primary" onClick={goNext}>
                      See snapshot →
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "snapshot" ? (
                <div className="cs-card p-6 sm:p-8 rounded-[30px] space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="space-y-1">
                      <div className="text-lg font-bold tracking-tight">Snapshot</div>
                      <div className="text-sm text-[var(--cs-muted)]">Clean summary + a chat request that auto-fills.</div>
                    </div>
                    {stepValid.runway ? <span className={tag.tone}>{tag.label}</span> : null}
                  </div>

                  {!stepValid.runway ? (
                    <div className="text-sm text-[var(--cs-muted)]">Please complete Runway inputs first.</div>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <MiniCard
                          title="Runway"
                          value={`${runwayMonths} months`}
                          sub={`Target: ${bufferTargetMonths} months`}
                          tone="soft"
                        />
                        <MiniCard
                          title="Shock result"
                          value={`${surplusOrShortfall.kind === "Shortfall" ? "-" : "+"}$${formatMoneySGD(surplusOrShortfall.amount)}`}
                          sub={`${shockMonths}m • ${incomeDropPct}% drop`}
                          tone={surplusOrShortfall.kind === "Shortfall" ? "danger" : "good"}
                        />
                        <MiniCard
                          title="Next milestone"
                          value={`${milestone} months`}
                          sub={essentialsMonthly > 0 ? `~$${formatMoneySGD(milestoneAmount)}` : "—"}
                          tone="soft"
                        />
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <Gauge
                          label="Progress to target runway"
                          valueText={`${Math.round(pct(runwayProgressPct))}%`}
                          pct={runwayProgressPct}
                          sub={`Target amount: $${formatMoneySGD(bufferTargetAmount)} • Savings: $${formatMoneySGD(liquidSavings)}`}
                        />

                        <div className="rounded-[26px] bg-white/75 border border-[color:var(--cs-border)] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
                          <div className="text-sm font-semibold">Suggested next move</div>
                          <div className="text-xs text-[var(--cs-muted)] mt-1">A single sentence you can act on.</div>

                          <div className="mt-4 grid gap-3">
                            {runwayMonths < 1 ? (
                              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                                <div className="text-sm font-semibold">Get to 1 month buffer first</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Aim for roughly <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(essentialsMonthly)}</span>.
                                </div>
                              </div>
                            ) : runwayMonths < 3 ? (
                              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                <div className="text-sm font-semibold">Next: 3 months buffer</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Aim for roughly <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(essentialsMonthly * 3)}</span>.
                                </div>
                              </div>
                            ) : runwayMonths < bufferTargetMonths ? (
                              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                                <div className="text-sm font-semibold">Target: {bufferTargetMonths} months runway</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Aim for roughly <span className="font-semibold text-[var(--cs-text)]">${formatMoneySGD(bufferTargetAmount)}</span>.
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                                <div className="text-sm font-semibold">Maintain mode</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Keep the buffer steady and prevent “fixed-cost creep”.
                                </div>
                              </div>
                            )}

                            {surplusOrShortfall.kind === "Shortfall" ? (
                              <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                                <div className="text-sm font-semibold">Shock gap exists</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Build buffer faster or reduce fixed monthly commitments.
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                                <div className="text-sm font-semibold">Shock scenario covered</div>
                                <div className="text-xs text-[var(--cs-muted)] mt-1">
                                  Great — now protect it with consistent habits.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] bg-[color:var(--cs-card)/0.55] border border-[color:var(--cs-border)] p-6">
                        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                          <div>
                            <div className="text-sm font-semibold">Request a chat</div>
                            <div className="text-sm text-[var(--cs-muted)] mt-1">
                              If you want, send a request and I’ll reach out. The form will auto-fill your summary.
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a className="cs-btn cs-btn-primary" href={contactHref}>
                              Request a chat
                            </a>
                            <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("runway")}>
                              Adjust inputs
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white/70 border border-[color:var(--cs-border)] p-4">
                          <div className="text-xs text-[var(--cs-muted)]">Auto-filled summary preview</div>
                          <pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--cs-text)] font-medium">
                            {contactSummary}
                          </pre>
                        </div>

                        <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                          Disclaimer: General information only. Not financial advice and not a product recommendation.
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                        <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
                          Back
                        </button>
                        <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("start")}>
                          Restart
                        </button>
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
                    <div className="text-xs text-[var(--cs-muted)] mt-1">Always looks “alive”.</div>
                  </div>
                  {stepValid.runway ? <span className={tag.tone}>{tag.label}</span> : <span className="cs-badge">Draft</span>}
                </div>

                <div className="mt-4 grid gap-3">
                  <MiniCard
                    title={`${expenseMode === "monthly" ? "Monthly" : "Annual"} expenses`}
                    value={essentialsValue > 0 ? `$${formatMoneySGD(essentialsValue)}` : "—"}
                    sub="Your input"
                  />
                  <MiniCard title="Liquid savings" value={`$${formatMoneySGD(liquidSavings)}`} sub="Accessible cash" />
                  <MiniCard
                    title="Runway"
                    value={stepValid.runway ? `${runwayMonths} months` : "—"}
                    sub={`Target: ${bufferTargetMonths}m`}
                  />
                </div>

                <div className="mt-4 rounded-[22px] bg-[color:var(--cs-card)/0.6] border border-[color:var(--cs-border)] p-4">
                  <div className="text-xs text-[var(--cs-muted)]">Shock test</div>
                  <div className="mt-1 text-sm font-semibold">{shockMonths} months • {incomeDropPct}% drop</div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    {surplusOrShortfall.kind}:{" "}
                    <span className="font-semibold text-[var(--cs-text)]">
                      ${formatMoneySGD(surplusOrShortfall.amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] bg-white/70 border border-[color:var(--cs-border)] p-4">
                  <div className="text-xs text-[var(--cs-muted)]">Milestone</div>
                  <div className="mt-1 text-sm font-semibold">{milestone} months</div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    About ${formatMoneySGD(milestoneAmount)} based on your expenses.
                  </div>
                </div>
              </div>

              <div className="cs-card p-5 rounded-[26px]">
                <div className="text-sm font-semibold">Tiny tip</div>
                <div className="mt-2 text-xs text-[var(--cs-muted)] leading-relaxed">
                  If this is for clients: start with expenses → savings → runway months. Shock test only after they understand runway.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

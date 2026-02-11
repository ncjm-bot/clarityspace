"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Unit = "Monthly" | "Yearly";
type IncomeStability = "Stable" | "Irregular";
type Level = "Low" | "Moderate" | "Strong";

type StepKey = "start" | "buffer" | "stress" | "protection" | "results";

type Result = {
  essentialsMonthly: number;
  savings: number;
  bufferMonths: number;
  bufferTargetMonths: number;
  bufferTargetAmount: number;
  bufferProgressPct: number;
  shockMonths: number;
  shockNeed: number;
  shockGap: number;
  dependents: number;
  hasDebtStress: boolean;
  overallScore: number;
  level: Level;
  notes: string[];
  protection?: {
    annualIncome: number;
    deathTpdGuide: number;
    ciGuide: number;
    existingDeathTpd: number;
    existingCi: number;
    deathTpdGap: number;
    ciGap: number;
    monthlyPremium: number;
    premiumCapMonthly: number;
    premiumOver: number;
  } | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmt(n: number) {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("en-SG");
}

function toNumberSafe(v: string) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function recommendedMonths(stability: IncomeStability) {
  return stability === "Irregular" ? 12 : 6;
}

function bufferScoreFromMonths(months: number) {
  if (months <= 0) return 0;
  if (months < 1) return 10;
  if (months < 3) return 30;
  if (months < 6) return 60;
  if (months < 12) return 85;
  return 95;
}

function levelFromScore(score: number): Level {
  if (score < 40) return "Low";
  if (score >= 70) return "Strong";
  return "Moderate";
}

function badgeClass(level: Level) {
  if (level === "Strong") return "cs-badge cs-badge-good";
  if (level === "Moderate") return "cs-badge cs-badge-warn";
  return "cs-badge cs-badge-risk";
}

function levelLabel(level: Level) {
  if (level === "Low") return "RISK";
  return level.toUpperCase();
}

function encodeQuery(obj: Record<string, string>) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) sp.set(k, v);
  });
  return sp.toString();
}

function safePct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return clamp(n, 0, 140);
}

function softBarWidth(pct: number) {
  return `${Math.min(100, Math.max(0, pct))}%`;
}

function chipClass(active: boolean) {
  return active ? "cs-badge cs-badge-good" : "cs-badge";
}

function stepTitle(step: StepKey) {
  if (step === "start") return "Start";
  if (step === "buffer") return "Buffer";
  if (step === "stress") return "Stress test";
  if (step === "protection") return "Protection";
  return "Results";
}

function stepSubtitle(step: StepKey) {
  if (step === "start") return "A quick, beginner-friendly self-check.";
  if (step === "buffer") return "How long can your savings cover essentials?";
  if (step === "stress") return "What if income drops for a while?";
  if (step === "protection") return "Optional sanity check (no product names).";
  return "Your snapshot + next steps.";
}

function sectionPill(text: string) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-[var(--cs-border)] bg-white">
      {text}
    </span>
  );
}

export default function ResilienceScoreTool() {
  const sp = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<StepKey>("start");

  const [unit, setUnit] = useState<Unit>("Monthly");
  const [incomeStability, setIncomeStability] = useState<IncomeStability>("Stable");

  const [essentialsInput, setEssentialsInput] = useState<string>("");
  const [savingsInput, setSavingsInput] = useState<string>("");

  const [dependents, setDependents] = useState<number>(0);
  const [hasDebtStress, setHasDebtStress] = useState<boolean>(false);

  const [shockMonths, setShockMonths] = useState<number>(6);
  const [incomeDropPct, setIncomeDropPct] = useState<number>(50);

  const [showProtection, setShowProtection] = useState<boolean>(false);
  const [annualIncomeInput, setAnnualIncomeInput] = useState<string>("");
  const [existingDeathTpdInput, setExistingDeathTpdInput] = useState<string>("");
  const [existingCiInput, setExistingCiInput] = useState<string>("");
  const [monthlyPremiumInput, setMonthlyPremiumInput] = useState<string>("");

  const [openHelp, setOpenHelp] = useState<boolean>(false);

  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    const qStep = (sp.get("s") || "") as StepKey;
    const qUnit = (sp.get("u") || "") as Unit;
    const qStab = (sp.get("stab") || "") as IncomeStability;

    const qE = sp.get("e") || "";
    const qS = sp.get("sv") || "";
    const qDep = sp.get("dep") || "";
    const qDebt = sp.get("debt") || "";
    const qShockM = sp.get("sm") || "";
    const qDrop = sp.get("drop") || "";
    const qProt = sp.get("prot") || "";
    const qInc = sp.get("inc") || "";
    const qD = sp.get("d") || "";
    const qCi = sp.get("ci") || "";
    const qPrem = sp.get("prem") || "";

    if (qUnit === "Monthly" || qUnit === "Yearly") setUnit(qUnit);
    if (qStab === "Stable" || qStab === "Irregular") setIncomeStability(qStab);

    if (qE) setEssentialsInput(qE);
    if (qS) setSavingsInput(qS);

    const depN = Number(qDep);
    if (Number.isFinite(depN) && depN >= 0) setDependents(clamp(Math.floor(depN), 0, 3));

    setHasDebtStress(qDebt === "1");

    const smN = Number(qShockM);
    if (Number.isFinite(smN) && smN >= 3 && smN <= 12) setShockMonths(Math.floor(smN));

    const dropN = Number(qDrop);
    if (Number.isFinite(dropN) && dropN >= 10 && dropN <= 90) setIncomeDropPct(Math.floor(dropN));

    setShowProtection(qProt === "1");
    if (qInc) setAnnualIncomeInput(qInc);
    if (qD) setExistingDeathTpdInput(qD);
    if (qCi) setExistingCiInput(qCi);
    if (qPrem) setMonthlyPremiumInput(qPrem);

    if (qStep === "start" || qStep === "buffer" || qStep === "stress" || qStep === "protection" || qStep === "results") {
      setStep(qStep);
    }
  }, [sp]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const parsed = useMemo(() => {
    const essentialsRaw = toNumberSafe(essentialsInput);
    const savings = toNumberSafe(savingsInput);

    const essentialsMonthly = unit === "Monthly" ? essentialsRaw : essentialsRaw / 12;

    const annualIncome = toNumberSafe(annualIncomeInput);
    const existingDeathTpd = toNumberSafe(existingDeathTpdInput);
    const existingCi = toNumberSafe(existingCiInput);
    const monthlyPremium = toNumberSafe(monthlyPremiumInput);

    return {
      essentialsMonthly: Math.max(0, essentialsMonthly),
      essentialsRaw: Math.max(0, essentialsRaw),
      savings: Math.max(0, savings),
      annualIncome: Math.max(0, annualIncome),
      existingDeathTpd: Math.max(0, existingDeathTpd),
      existingCi: Math.max(0, existingCi),
      monthlyPremium: Math.max(0, monthlyPremium),
    };
  }, [essentialsInput, savingsInput, unit, annualIncomeInput, existingDeathTpdInput, existingCiInput, monthlyPremiumInput]);

  const result: Result | null = useMemo(() => {
    if (parsed.essentialsMonthly <= 0) return null;

    const essentialsMonthly = parsed.essentialsMonthly;
    const savings = parsed.savings;

    const bufferMonths = round1(savings / essentialsMonthly);

    const bufferTargetMonths = recommendedMonths(incomeStability);
    const bufferTargetAmount = essentialsMonthly * bufferTargetMonths;
    const bufferProgressPct = safePct((savings / (bufferTargetAmount || 1)) * 100);

    const bufferScore = bufferScoreFromMonths(savings / essentialsMonthly);

    const effectiveShortfallMonthly = essentialsMonthly * (incomeDropPct / 100);
    const shockNeed = effectiveShortfallMonthly * shockMonths;
    const shockGap = Math.max(shockNeed - savings, 0);
    const shockScore = clamp(100 - (shockGap / (shockNeed || 1)) * 100, 0, 100);

    let dependentPenalty = 0;
    if (dependents === 1) dependentPenalty = 6;
    if (dependents === 2) dependentPenalty = 10;
    if (dependents >= 3) dependentPenalty = 14;

    const debtPenalty = hasDebtStress ? 10 : 0;

    const raw =
      bufferScore * 0.55 +
      shockScore * 0.35 -
      dependentPenalty -
      debtPenalty;

    const overallScore = clamp(Math.round(raw), 0, 100);
    const level = levelFromScore(overallScore);

    const notes: string[] = [];

    if (bufferMonths < 1) notes.push("You’re living very close to the edge — start with 1 month buffer first.");
    else if (bufferMonths < 3) notes.push("You have some cushion. Aim to reach 3 months buffer as a next milestone.");
    else if (bufferMonths < bufferTargetMonths) notes.push(`Good start. Next milestone: ${bufferTargetMonths} months buffer based on your income stability.`);
    else notes.push("Your buffer is in a healthier range. The goal is to maintain and avoid big leaks.");

    if (hasDebtStress) notes.push("High-interest debt can drain buffer fast. Consider prioritising it.");
    if (dependents >= 1) notes.push("With dependents, stability matters more — keep your buffer and protection awareness tight.");

    const protection = (() => {
      if (!showProtection) return null;
      if (parsed.annualIncome <= 0) return null;

      const annualIncome = parsed.annualIncome;

      const deathTpdGuide = annualIncome * 9;
      const ciGuide = annualIncome * 4;

      const deathTpdGap = Math.max(deathTpdGuide - parsed.existingDeathTpd, 0);
      const ciGap = Math.max(ciGuide - parsed.existingCi, 0);

      const premiumCapMonthly = (annualIncome / 12) * 0.15;
      const premiumOver = Math.max(parsed.monthlyPremium - premiumCapMonthly, 0);

      return {
        annualIncome,
        deathTpdGuide,
        ciGuide,
        existingDeathTpd: parsed.existingDeathTpd,
        existingCi: parsed.existingCi,
        deathTpdGap,
        ciGap,
        monthlyPremium: parsed.monthlyPremium,
        premiumCapMonthly,
        premiumOver,
      };
    })();

    return {
      essentialsMonthly,
      savings,
      bufferMonths,
      bufferTargetMonths,
      bufferTargetAmount,
      bufferProgressPct,
      shockMonths,
      shockNeed,
      shockGap,
      dependents,
      hasDebtStress,
      overallScore,
      level,
      notes,
      protection,
    };
  }, [parsed, incomeStability, shockMonths, incomeDropPct, dependents, hasDebtStress, showProtection]);

  const summaryText = useMemo(() => {
    if (!result) return "";
    return `Resilience ${result.overallScore}/100 • Buffer ${result.bufferMonths} months • Stress gap $${fmt(result.shockGap)}`;
  }, [result]);

  const canGoNextFromStart = parsed.essentialsMonthly > 0;
  const canGoNextFromBuffer = result !== null;
  const canGoNextFromStress = result !== null;

  function goNext() {
    if (step === "start") setStep("buffer");
    else if (step === "buffer") setStep("stress");
    else if (step === "stress") setStep("protection");
    else if (step === "protection") setStep("results");
  }

  function goBack() {
    if (step === "results") setStep("protection");
    else if (step === "protection") setStep("stress");
    else if (step === "stress") setStep("buffer");
    else if (step === "buffer") setStep("start");
  }

  function saveLink() {
    const q = encodeQuery({
      s: step,
      u: unit,
      stab: incomeStability,
      e: essentialsInput || "",
      sv: savingsInput || "",
      dep: String(dependents),
      debt: hasDebtStress ? "1" : "0",
      sm: String(shockMonths),
      drop: String(incomeDropPct),
      prot: showProtection ? "1" : "0",
      inc: annualIncomeInput || "",
      d: existingDeathTpdInput || "",
      ci: existingCiInput || "",
      prem: monthlyPremiumInput || "",
    });

    const url = `${window.location.origin}/tools/resilience?${q}`;
    navigator.clipboard.writeText(url).then(
      () => setToast("Link copied ✅"),
      () => setToast("Couldn’t copy — try manually")
    );
  }

  function jumpTo(s: StepKey) {
    setStep(s);
  }

  const topGradient = useMemo(() => {
    return "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(0,184,148,0.10))";
  }, []);

  const examples = [
    { k: "essentials", label: "What counts as essentials?", active: false },
    { k: "savings", label: "What counts as liquid savings?", active: false },
    { k: "stability", label: "Stable vs Irregular income?", active: false },
    { k: "stress", label: "What is this stress test?", active: false },
    { k: "protection", label: "Why show protection benchmarks?", active: false },
  ] as const;

  const [activeHelpKey, setActiveHelpKey] = useState<(typeof examples)[number]["k"]>("essentials");

  const helpContent = useMemo(() => {
    if (activeHelpKey === "essentials") {
      return {
        title: "Essentials (simple)",
        body: [
          "Things you must pay even if life gets messy:",
          "• Food, transport, bills, rent/mortgage",
          "• Insurance premiums you must keep",
          "• Parents allowance / key family support",
          "Tip: Don’t include “wants” (shopping, travel, luxury).",
        ],
      };
    }
    if (activeHelpKey === "savings") {
      return {
        title: "Liquid savings",
        body: [
          "Money you can access quickly:",
          "• Bank balance, cash, very short-term funds",
          "Avoid counting: locked investments, CPF, assets you can’t sell fast.",
        ],
      };
    }
    if (activeHelpKey === "stability") {
      return {
        title: "Income stability",
        body: [
          "Stable: regular salary, predictable income.",
          "Irregular: commission-heavy, self-employed, freelance, variable bonuses.",
          "We use a higher buffer target when income is irregular.",
        ],
      };
    }
    if (activeHelpKey === "stress") {
      return {
        title: "Stress test (layman)",
        body: [
          "A ‘what if’ scenario: income drops for a while.",
          "We estimate how much cash you need to survive that period.",
          "You can adjust:",
          "• months (3–12)",
          "• income drop (10–90%)",
        ],
      };
    }
    return {
      title: "Protection benchmarks (optional)",
      body: [
        "This is not a recommendation. It’s a simple sense-check.",
        "We show basic benchmarks commonly used in Singapore guides:",
        "• Death/TPD: 9× annual income",
        "• CI: 4× annual income",
        "• Premium comfort: ~15% of income",
        "You can leave this OFF if you prefer.",
      ],
    };
  }, [activeHelpKey]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <a href="/tools" className="text-sm text-[var(--cs-muted)] hover:underline">
          ← Back to tools
        </a>

        <div className="cs-card p-6" style={{ backgroundImage: topGradient }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {sectionPill("Educational self-check")}
                {sectionPill("Beginner-friendly")}
                {sectionPill("No product names")}
              </div>
              <h1 className="text-3xl font-bold">Resilience Score</h1>
              <p className="text-[var(--cs-muted)]">
                A simple way to spot pressure points: buffer, stress gap, and (optional) protection sanity checks.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setOpenHelp(true)}>
                Explain to me
              </button>
              <button type="button" className="cs-btn cs-btn-ghost" onClick={saveLink}>
                Save / share link
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(["start", "buffer", "stress", "protection", "results"] as StepKey[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`cs-btn ${step === s ? "cs-btn-primary" : "cs-btn-ghost"}`}
                  onClick={() => jumpTo(s)}
                >
                  {stepTitle(s)}
                </button>
              ))}
            </div>

            {result && (
              <span className={badgeClass(result.level)}>
                {levelLabel(result.level)} • {result.overallScore}/100
              </span>
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <div className="cs-card p-4">
          <div className="text-sm font-semibold">{toast}</div>
        </div>
      ) : null}

      {step === "start" && (
        <div className="cs-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-lg font-bold">{stepTitle(step)}</div>
            <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="cs-card p-5">
              <div className="text-sm font-semibold">Input style</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">Choose how you want to enter essentials.</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={`cs-btn ${unit === "Monthly" ? "cs-btn-primary" : "cs-btn-ghost"}`}
                  onClick={() => setUnit("Monthly")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`cs-btn ${unit === "Yearly" ? "cs-btn-primary" : "cs-btn-ghost"}`}
                  onClick={() => setUnit("Yearly")}
                >
                  Per year
                </button>
              </div>
            </div>

            <div className="cs-card p-5">
              <div className="text-sm font-semibold">Income stability</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">This affects the buffer target shown.</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={`cs-btn ${incomeStability === "Stable" ? "cs-btn-primary" : "cs-btn-ghost"}`}
                  onClick={() => setIncomeStability("Stable")}
                >
                  Stable
                </button>
                <button
                  type="button"
                  className={`cs-btn ${incomeStability === "Irregular" ? "cs-btn-primary" : "cs-btn-ghost"}`}
                  onClick={() => setIncomeStability("Irregular")}
                >
                  Irregular
                </button>
              </div>
            </div>
          </div>

          <div className="cs-card p-5">
            <div className="text-sm font-semibold">Quick examples</div>
            <div className="text-xs text-[var(--cs-muted)] mt-1">Tap to understand what each field means.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  className={chipClass(activeHelpKey === x.k)}
                  onClick={() => {
                    setActiveHelpKey(x.k);
                    setOpenHelp(true);
                  }}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="cs-btn cs-btn-primary"
              onClick={goNext}
              disabled={!canGoNextFromStart}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "buffer" && (
        <div className="cs-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-lg font-bold">{stepTitle(step)}</div>
            <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-semibold">
                Essentials ({unit === "Monthly" ? "per month" : "per year"}) (SGD)
              </div>
              <input
                inputMode="numeric"
                className="cs-input"
                value={essentialsInput}
                onChange={(e) => setEssentialsInput(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder={unit === "Monthly" ? "e.g. 2500" : "e.g. 30000"}
              />
              <div className="text-xs text-[var(--cs-muted)]">The bare minimum you must pay.</div>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-semibold">Liquid savings (SGD)</div>
              <input
                inputMode="numeric"
                className="cs-input"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="e.g. 12000"
              />
              <div className="text-xs text-[var(--cs-muted)]">Money you can access fast.</div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="cs-card p-5">
              <div className="text-sm font-semibold">Dependents</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">Anyone relying on your income.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`cs-btn ${dependents === n ? "cs-btn-primary" : "cs-btn-ghost"}`}
                    onClick={() => setDependents(n)}
                  >
                    {n === 3 ? "3+" : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="cs-card p-5">
              <div className="text-sm font-semibold">Any high-interest debt?</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">This can weaken your buffer quickly.</div>
              <label className="mt-3 flex items-start gap-2 text-sm text-[var(--cs-muted)]">
                <input
                  type="checkbox"
                  checked={hasDebtStress}
                  onChange={(e) => setHasDebtStress(e.target.checked)}
                />
                <span>Yes — it affects my cashflow</span>
              </label>
            </div>
          </div>

          {result && (
            <div className="cs-card p-6 space-y-4" style={{ backgroundImage: "linear-gradient(135deg, rgba(0,184,148,0.10), rgba(108,92,231,0.10))" }}>
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div>
                  <div className="text-sm text-[var(--cs-muted)]">Your buffer</div>
                  <div className="text-3xl font-bold">{result.bufferMonths} months</div>
                  <div className="text-xs text-[var(--cs-muted)] mt-1">
                    Target used: {result.bufferTargetMonths} months (based on income stability)
                  </div>
                </div>

                <div className="w-full sm:w-[320px]">
                  <div className="text-xs text-[var(--cs-muted)]">Progress to target</div>
                  <div className="mt-2 h-3 rounded-full bg-[var(--cs-border)] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: softBarWidth(result.bufferProgressPct),
                        background: "var(--cs-accent)" as any,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    Target amount: <span className="font-semibold text-[var(--cs-text)]">${fmt(result.bufferTargetAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-[var(--cs-muted)] leading-relaxed">
                Tip: If you’re starting out, focus on milestones: 1 month → 3 months → target.
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
              Back
            </button>
            <button
              type="button"
              className="cs-btn cs-btn-primary"
              onClick={goNext}
              disabled={!canGoNextFromBuffer}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "stress" && (
        <div className="cs-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-lg font-bold">{stepTitle(step)}</div>
            <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="cs-card p-5">
              <div className="text-sm font-semibold">How long (months)?</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">Common range: 3 to 12 months.</div>
              <div className="mt-3 flex items-center justify-between gap-3">
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

            <div className="cs-card p-5">
              <div className="text-sm font-semibold">Income drop (%)</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">Example: 50% drop = you need to cover half of essentials.</div>
              <div className="mt-3 flex items-center justify-between gap-3">
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

          {result && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="cs-card p-6">
                <div className="text-sm font-semibold">Stress gap</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Cash needed to cover the shortfall over {shockMonths} months.
                </div>
                <div className="mt-3 text-3xl font-bold">${fmt(result.shockGap)}</div>
                <div className="mt-2 text-sm text-[var(--cs-muted)]">
                  Stress need: <span className="font-semibold text-[var(--cs-text)]">${fmt(result.shockNeed)}</span>
                </div>
              </div>

              <div className="cs-card p-6" style={{ backgroundImage: "linear-gradient(135deg, rgba(108,92,231,0.10), rgba(0,184,148,0.08))" }}>
                <div className="text-sm font-semibold">Quick interpretation</div>
                <ul className="mt-2 text-sm text-[var(--cs-muted)] list-disc pl-5 space-y-1">
                  {result.shockGap > 0 ? (
                    <>
                      <li>You may run out of cash in this scenario.</li>
                      <li>Focus on buffer + lowering fixed commitments.</li>
                    </>
                  ) : (
                    <>
                      <li>Your savings can cover this stress test.</li>
                      <li>Next is maintaining discipline and avoiding big leaks.</li>
                    </>
                  )}
                  <li>This is simplified — it doesn’t include every life detail.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
              Back
            </button>
            <button
              type="button"
              className="cs-btn cs-btn-primary"
              onClick={goNext}
              disabled={!canGoNextFromStress}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "protection" && (
        <div className="cs-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-lg font-bold">{stepTitle(step)}</div>
            <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
          </div>

          <div className="cs-card p-5">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <div className="text-sm font-semibold">Turn on optional benchmarks?</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  This is a sense-check only (no product names, no recommendations).
                </div>
              </div>
              <button
                type="button"
                className={`cs-btn ${showProtection ? "cs-btn-primary" : "cs-btn-ghost"}`}
                onClick={() => setShowProtection((v) => !v)}
              >
                {showProtection ? "On" : "Off"}
              </button>
            </div>

            {showProtection && (
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Annual income (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={annualIncomeInput}
                    onChange={(e) => setAnnualIncomeInput(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 60000"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Monthly premiums (optional)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={monthlyPremiumInput}
                    onChange={(e) => setMonthlyPremiumInput(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 200"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Existing Death/TPD (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={existingDeathTpdInput}
                    onChange={(e) => setExistingDeathTpdInput(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 300000"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Existing CI (SGD)</div>
                  <input
                    inputMode="numeric"
                    className="cs-input"
                    value={existingCiInput}
                    onChange={(e) => setExistingCiInput(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 150000"
                  />
                </label>
              </div>
            )}
          </div>

          {result?.protection && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="cs-card p-6">
                <div className="text-sm font-semibold">Benchmarks (simple)</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Death/TPD guide: 9× income • CI guide: 4× income
                </div>

                <div className="mt-4 space-y-3">
                  <div className="cs-card p-4">
                    <div className="text-sm font-semibold">Death/TPD gap</div>
                    <div className="mt-2">
                      <span className={result.protection.deathTpdGap > 0 ? "cs-badge cs-badge-risk" : "cs-badge cs-badge-good"}>
                        ${fmt(result.protection.deathTpdGap)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--cs-muted)]">
                      Guide: ${fmt(result.protection.deathTpdGuide)} • Existing: ${fmt(result.protection.existingDeathTpd)}
                    </div>
                  </div>

                  <div className="cs-card p-4">
                    <div className="text-sm font-semibold">CI gap</div>
                    <div className="mt-2">
                      <span className={result.protection.ciGap > 0 ? "cs-badge cs-badge-risk" : "cs-badge cs-badge-good"}>
                        ${fmt(result.protection.ciGap)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--cs-muted)]">
                      Guide: ${fmt(result.protection.ciGuide)} • Existing: ${fmt(result.protection.existingCi)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cs-card p-6" style={{ backgroundImage: "linear-gradient(135deg, rgba(0,184,148,0.10), rgba(108,92,231,0.10))" }}>
                <div className="text-sm font-semibold">Premium comfort (optional)</div>
                <div className="text-xs text-[var(--cs-muted)] mt-1">
                  Benchmark: ~15% of income
                </div>

                <div className="mt-4 cs-card p-4">
                  <div className="text-sm font-semibold">Monthly cap estimate</div>
                  <div className="mt-2 text-2xl font-bold">${fmt(result.protection.premiumCapMonthly)}</div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    Your input: ${fmt(result.protection.monthlyPremium)} / month
                  </div>
                  <div className="mt-2 text-sm">
                    Over cap:{" "}
                    <span className={result.protection.premiumOver > 0 ? "cs-badge cs-badge-warn" : "cs-badge cs-badge-good"}>
                      ${fmt(result.protection.premiumOver)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                  If it’s over, it doesn’t mean “wrong”. It just flags “cashflow might feel tight”.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
              Back
            </button>
            <button type="button" className="cs-btn cs-btn-primary" onClick={goNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="cs-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-lg font-bold">{stepTitle(step)}</div>
            <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
          </div>

          {!result ? (
            <div className="text-sm text-[var(--cs-muted)]">
              Please go back and enter essentials + savings first.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="cs-card p-6" style={{ backgroundImage: "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(255,159,67,0.10))" }}>
                  <div className="text-sm text-[var(--cs-muted)]">Score</div>
                  <div className="text-4xl font-bold">{result.overallScore}/100</div>
                  <div className="mt-2">
                    <span className={badgeClass(result.level)}>{levelLabel(result.level)}</span>
                  </div>
                </div>

                <div className="cs-card p-6">
                  <div className="text-sm text-[var(--cs-muted)]">Buffer</div>
                  <div className="text-3xl font-bold">{result.bufferMonths} months</div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    Target: {result.bufferTargetMonths} months
                  </div>
                </div>

                <div className="cs-card p-6">
                  <div className="text-sm text-[var(--cs-muted)]">Stress gap</div>
                  <div className="text-3xl font-bold">${fmt(result.shockGap)}</div>
                  <div className="mt-2 text-xs text-[var(--cs-muted)]">
                    ({shockMonths} months, {incomeDropPct}% drop)
                  </div>
                </div>
              </div>

              <div className="cs-card p-6">
                <div className="text-sm font-semibold">What this suggests (simple)</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {result.notes.map((n) => (
                    <div key={n} className="cs-card p-4">
                      <div className="text-sm text-[var(--cs-text)]">{n}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cs-card p-6">
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div>
                    <div className="text-sm font-semibold">Want a personalised review?</div>
                    <div className="text-sm text-[var(--cs-muted)] mt-1">
                      This is simplified educational info. If you want, request a chat and I’ll reach out.
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <a
                      className="cs-btn cs-btn-primary"
                      href={`/contact?tool=resilience&summary=${encodeURIComponent(summaryText)}`}
                    >
                      Send request
                    </a>
                    <a className="cs-btn cs-btn-ghost" href="/tools">
                      Back to tools
                    </a>
                  </div>
                </div>

                <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                  General information only. Not financial advice and not a product recommendation.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" className="cs-btn cs-btn-ghost" onClick={goBack}>
              Back
            </button>
            <button type="button" className="cs-btn cs-btn-ghost" onClick={() => setStep("start")}>
              Restart
            </button>
          </div>
        </div>
      )}

      {openHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenHelp(false)} />
          <div className="relative w-full max-w-lg cs-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-[var(--cs-muted)]">Explain with examples</div>
                <div className="text-2xl font-bold">{helpContent.title}</div>
                <div className="text-sm text-[var(--cs-muted)]">{stepSubtitle(step)}</div>
              </div>
              <button className="cs-btn cs-btn-ghost" type="button" onClick={() => setOpenHelp(false)}>
                Close
              </button>
            </div>

            <div className="mt-4 cs-card p-4">
              <div className="space-y-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                {helpContent.body.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {examples.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  className={chipClass(activeHelpKey === x.k)}
                  onClick={() => setActiveHelpKey(x.k)}
                >
                  {x.label}
                </button>
              ))}
            </div>

            <div className="mt-5 text-xs text-[var(--cs-muted)]">
              Educational only. No product names, no comparisons.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

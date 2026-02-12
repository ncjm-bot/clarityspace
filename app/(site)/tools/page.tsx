"use client";

import React, { useMemo, useState } from "react";

type ToolBucket = "Start" | "Protect" | "Plan" | "Retire";

type Tool = {
  key: string;
  title: string;
  desc: string;
  href: string;
  bucket: ToolBucket;
  icon: React.ReactNode;
  meta: string[];
  cta: string;
  accent: "mint" | "violet" | "amber" | "blue";
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function accentGlow(accent: Tool["accent"]) {
  if (accent === "mint") return "bg-[rgba(0,184,148,0.16)]";
  if (accent === "violet") return "bg-[rgba(108,92,231,0.16)]";
  if (accent === "amber") return "bg-[rgba(183,121,31,0.14)]";
  return "bg-[rgba(116,185,255,0.16)]";
}

function accentBlob(accent: Tool["accent"]) {
  if (accent === "mint") return "bg-[rgba(0,184,148,0.10)]";
  if (accent === "violet") return "bg-[rgba(108,92,231,0.10)]";
  if (accent === "amber") return "bg-[rgba(183,121,31,0.10)]";
  return "bg-[rgba(116,185,255,0.10)]";
}

function accentDotClass(accent: Tool["accent"]) {
  if (accent === "mint") return "bg-[rgba(0,184,148,0.30)]";
  if (accent === "violet") return "bg-[rgba(108,92,231,0.30)]";
  if (accent === "amber") return "bg-[rgba(183,121,31,0.26)]";
  return "bg-[rgba(116,185,255,0.30)]";
}

function FilterPill(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cx(
        "px-4 py-2 rounded-full text-sm font-semibold transition border",
        "border-[var(--cs-border)]",
        props.active
          ? "bg-white shadow-[0_10px_30px_rgba(15,43,31,0.08)]"
          : "bg-white/70 hover:bg-white/90 opacity-90"
      )}
    >
      {props.label}
    </button>
  );
}

export default function ToolsPage() {
  const tools: Tool[] = [
    {
      key: "buffer",
      title: "Emergency Buffer Check",
      desc: "Estimate how many months of runway you have if income stops — and what a safer buffer might look like.",
      href: "/tools/resilience",
      bucket: "Start",
      accent: "mint",
      meta: ["Runway estimate", "Shock scenario", "Next step"],
      cta: "Begin",
      icon: <div className="text-[34px] leading-none" aria-hidden="true">🧯</div>,
    },
    {
      key: "protection",
      title: "Coverage Snapshot",
      desc: "A clean view of possible gaps for major events (e.g., Death / Disability / Critical Illness).",
      href: "/tools/protection",
      bucket: "Protect",
      accent: "violet",
      meta: ["Gap view", "Education-only", "No comparisons"],
      cta: "Begin",
      icon: <div className="text-[34px] leading-none" aria-hidden="true">🛡️</div>,
    },
    {
      key: "education",
      title: "Education Goal Planner",
      desc: "Estimate a future education target and a straightforward set-aside path you can understand quickly.",
      href: "/tools/education",
      bucket: "Plan",
      accent: "blue",
      meta: ["Target", "Timeline", "Monthly / yearly"],
      cta: "Begin",
      icon: <div className="text-[34px] leading-none" aria-hidden="true">🎓</div>,
    },
    {
      key: "retirement",
      title: "Retirement Target Builder",
      desc: "Turn a rough retirement goal into a clearer number — then see what the gap could be.",
      href: "/tools/retirement",
      bucket: "Retire",
      accent: "amber",
      meta: ["Target", "Gap", "Set-aside guide"],
      cta: "Begin",
      icon: <div className="text-[34px] leading-none" aria-hidden="true">🏝️</div>,
    },
  ];

  const [filter, setFilter] = useState<"All" | ToolBucket>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return tools;
    return tools.filter((t) => t.bucket === filter);
  }, [filter]);

  const contactHref = `/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent(
    "I’d like a personalised review of my current situation."
  )}`;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[36px] border border-[var(--cs-border)] bg-white/65 backdrop-blur shadow-[0_18px_60px_rgba(15,43,31,0.08)]">
        <div className="absolute -top-44 -left-44 h-[560px] w-[560px] rounded-full bg-[rgba(0,184,148,0.12)] blur-3xl" />
        <div className="absolute -bottom-44 -right-44 h-[620px] w-[620px] rounded-full bg-[rgba(108,92,231,0.14)] blur-3xl" />

        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge cs-badge-good">Educational</span>
                <span className="cs-badge">No product names</span>
                <span className="cs-badge">No comparisons</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
                Tools, but calm.
              </h1>

              <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
                Choose a quick self-check, answer a few inputs, and get a clear snapshot. Results are simplified estimates for general information only.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <FilterPill active={filter === "All"} label="All" onClick={() => setFilter("All")} />
                <FilterPill active={filter === "Start"} label="Start" onClick={() => setFilter("Start")} />
                <FilterPill active={filter === "Protect"} label="Protect" onClick={() => setFilter("Protect")} />
                <FilterPill active={filter === "Plan"} label="Plan" onClick={() => setFilter("Plan")} />
                <FilterPill active={filter === "Retire"} label="Retire" onClick={() => setFilter("Retire")} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a className="cs-btn cs-btn-ghost" href="/disclaimer">
                Read disclaimer
              </a>
              <a className="cs-btn cs-btn-primary" href={contactHref}>
                Request a chat
              </a>
            </div>
          </div>

          <div className="mt-7 rounded-[24px] border border-[var(--cs-border)] bg-white/70 p-5">
            <div className="text-sm font-semibold">Before you use a tool</div>
            <div className="mt-1 text-sm text-[var(--cs-muted)] leading-relaxed">
              These tools are designed to help you think clearly — not to sell anything. If you want a personalised review, request a chat and I’ll follow up properly.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((t) => (
          <a
            key={t.key}
            href={t.href}
            className={cx(
              "group relative overflow-hidden rounded-[30px] border border-[var(--cs-border)]",
              "bg-white/70 backdrop-blur",
              "shadow-[0_18px_50px_rgba(15,43,31,0.08)] hover:shadow-[0_26px_70px_rgba(15,43,31,0.12)]",
              "transition"
            )}
          >
            <div className={cx("absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl opacity-70", accentBlob(t.accent))} />
            <div className={cx("absolute -bottom-14 -left-14 h-36 w-36 rounded-full blur-2xl opacity-70", accentBlob(t.accent))} />

            <div className="relative p-7 flex flex-col h-full">
              <div className="flex items-center justify-center pt-1">
                <div className="relative">
                  <div className={cx("absolute -inset-5 rounded-full blur-xl", accentGlow(t.accent))} />
                  <div className="relative h-[74px] w-[74px] rounded-[26px] border border-[var(--cs-border)] bg-white/80 flex items-center justify-center">
                    {t.icon}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <div className="text-lg font-bold tracking-tight">{t.title}</div>
                <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                  {t.desc}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {t.meta.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--cs-border)] bg-white/75 px-3 py-1 text-xs text-[var(--cs-muted)]"
                  >
                    <span className={cx("h-2 w-2 rounded-full", accentDotClass(t.accent))} />
                    {m}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <div className="text-center text-xs text-[var(--cs-muted)]">
                  General info only • Results are estimates
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 border border-[var(--cs-border)] bg-white/85 group-hover:bg-white transition">
                    <span className="text-sm font-semibold">{t.cta}</span>
                    <span className="text-sm" aria-hidden="true">→</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden rounded-[30px] border border-[var(--cs-border)] bg-white/70 backdrop-blur p-7">
          <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-[rgba(116,185,255,0.10)] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-[rgba(183,121,31,0.08)] blur-3xl" />

          <div className="relative">
            <div className="text-sm font-semibold">Not sure where to start?</div>
            <div className="mt-1 text-sm text-[var(--cs-muted)] leading-relaxed">
              If you’re new, start with the Emergency Buffer Check. If you’re already working, the Coverage Snapshot is usually the next quick win.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a className="cs-btn cs-btn-ghost" href="/tools/resilience">
                Start with buffer
              </a>
              <a className="cs-btn cs-btn-ghost" href="/tools/protection">
                Check coverage
              </a>
            </div>
          </div>
        </div>

        <div className="cs-card p-7 rounded-[30px]">
          <div className="text-sm font-semibold">Want a personalised review?</div>
          <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
            If you’d like help interpreting your results, request a chat. I’ll follow up using your preferred contact method.
          </div>
          <div className="mt-4">
            <a className="cs-btn cs-btn-primary w-full justify-center" href={contactHref}>
              Request a chat
            </a>
          </div>
          <div className="mt-3 text-xs text-[var(--cs-muted)] leading-relaxed">
            Follow-up conversation only. Not financial advice. No product recommendation.
          </div>
        </div>
      </section>
    </div>
  );
}

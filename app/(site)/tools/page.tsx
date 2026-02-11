"use client";

import React, { useMemo, useState } from "react";

type Tool = {
  key: string;
  title: string;
  desc: string;
  href: string;
  emoji: string;
  badge: { label: string; className: string };
  highlights: string[];
  tags: ("Start" | "Protect" | "Plan" | "Retire")[];
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function ChipButton(props: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cx(
        "px-3 py-2 rounded-full text-sm transition border",
        "backdrop-blur bg-white/60 hover:bg-white/80",
        "border-[var(--cs-border)]",
        props.active ? "shadow-sm bg-white/90" : ""
      )}
    >
      {props.label}
    </button>
  );
}

function MiniPill(props: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border border-[var(--cs-border)] bg-white/70">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--cs-accent,#6C5CE7)]" />
      {props.text}
    </span>
  );
}

export default function ToolsPage() {
  const tools: Tool[] = [
    {
      key: "resilience",
      title: "Resilience Score",
      desc: "Spot pressure points like buffer months, shock gap, and dependents impact — in plain English.",
      badge: { label: "CORE", className: "cs-badge cs-badge-good" },
      href: "/tools/resilience",
      highlights: ["Buffer months", "6-month shock gap", "Dependents impact"],
      emoji: "🛟",
      tags: ["Start", "Protect"],
    },
    {
      key: "protection",
      title: "Protection Gap Check",
      desc: "Clean snapshot of possible shortfalls across Death / TPD / Critical Illness (educational only).",
      badge: { label: "CORE", className: "cs-badge cs-badge-good" },
      href: "/tools/protection",
      highlights: ["Death / TPD / CI", "Shortfall view", "No comparisons"],
      emoji: "🛡️",
      tags: ["Protect", "Start"],
    },
    {
      key: "education",
      title: "Education Goal Planner",
      desc: "Estimate a future education target and a simple set-aside path (assumptions-based).",
      badge: { label: "NEW", className: "cs-badge cs-badge-warn" },
      href: "/tools/education",
      highlights: ["Target", "Timeline", "Monthly / yearly"],
      emoji: "🎓",
      tags: ["Plan"],
    },
    {
      key: "retirement",
      title: "Retirement Readiness",
      desc: "Estimate a retirement target, gap, and set-aside guide — without overwhelming the user.",
      badge: { label: "NEW", className: "cs-badge cs-badge-warn" },
      href: "/tools/retirement",
      highlights: ["Target nest egg", "Gap view", "Monthly / yearly"],
      emoji: "🏖️",
      tags: ["Retire", "Plan"],
    },
  ];

  const [filter, setFilter] = useState<"All" | "Start" | "Protect" | "Plan" | "Retire">("All");

  const filtered = useMemo(() => {
    if (filter === "All") return tools;
    return tools.filter((t) => t.tags.includes(filter));
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Premium hero */}
      <div className="relative overflow-hidden rounded-[34px]">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[color:var(--cs-card)/0.70]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />

        <div className="relative p-6 sm:p-10 border border-[var(--cs-border)] rounded-[34px] bg-white/50 backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <MiniPill text="Educational" />
                <MiniPill text="No product names" />
                <MiniPill text="No comparisons" />
                <MiniPill text="Plain English" />
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
                Tools that feel
                <span className="ml-2 inline-block rounded-2xl px-3 py-1 bg-white/70 border border-[var(--cs-border)]">
                  simple
                </span>
                ,
                <span className="ml-2 inline-block rounded-2xl px-3 py-1 bg-white/70 border border-[var(--cs-border)]">
                  visual
                </span>
                ,
                <span className="ml-2 inline-block rounded-2xl px-3 py-1 bg-white/70 border border-[var(--cs-border)]">
                  calm
                </span>
                .
              </h1>

              <p className="text-[var(--cs-muted)] max-w-2xl">
                Bite-sized self-checks for people starting out. Get a quick sense of gaps and next steps —
                without getting drowned in jargon.
              </p>

              {/* Playable filter bar */}
              <div className="mt-3 flex flex-wrap gap-2">
                <ChipButton active={filter === "All"} label="All" onClick={() => setFilter("All")} />
                <ChipButton active={filter === "Start"} label="Starting out" onClick={() => setFilter("Start")} />
                <ChipButton active={filter === "Protect"} label="Protection" onClick={() => setFilter("Protect")} />
                <ChipButton active={filter === "Plan"} label="Planning" onClick={() => setFilter("Plan")} />
                <ChipButton active={filter === "Retire"} label="Retirement" onClick={() => setFilter("Retire")} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a className="cs-btn cs-btn-ghost" href="/privacy">
                Disclaimer
              </a>
              <a
                className="cs-btn cs-btn-primary"
                href={`/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent(
                  "I’d like a personalised review of my current situation."
                )}`}
              >
                Request a chat
              </a>
            </div>
          </div>

          {/* Tiny “features strip” to make it feel designed */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/70 p-5">
              <div className="text-sm font-semibold">Fast & guided</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">Step-by-step flow, no overwhelming forms.</div>
            </div>
            <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/70 p-5">
              <div className="text-sm font-semibold">Visual summaries</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">Clear snapshot cards so users “get it” instantly.</div>
            </div>
            <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/70 p-5">
              <div className="text-sm font-semibold">Neutral & educational</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">No product names. No comparisons. No pushing.</div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-[var(--cs-border)] bg-white/70 p-5">
            <div className="text-sm font-semibold">Quick disclaimer</div>
            <div className="text-sm text-[var(--cs-muted)] mt-1">
              General information only. Results are estimates and do not replace a personalised review.
            </div>
          </div>
        </div>
      </div>

      {/* Premium tool tiles */}
      <div className="grid gap-5 sm:grid-cols-2">
        {filtered.map((t) => (
          <a
            key={t.key}
            href={t.href}
            className={cx(
              "group relative block overflow-hidden rounded-[30px]",
              "border border-[var(--cs-border)] bg-white/70 backdrop-blur",
              "shadow-[0_14px_38px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_52px_rgba(0,0,0,0.10)]",
              "transition"
            )}
          >
            {/* glow blobs */}
            <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-[rgba(108,92,231,0.14)] blur-3xl opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-[rgba(0,184,148,0.12)] blur-3xl opacity-0 group-hover:opacity-100 transition" />

            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-[22px] border border-[var(--cs-border)] bg-white/70 flex items-center justify-center text-2xl shadow-sm">
                    {t.emoji}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl sm:text-2xl font-bold tracking-tight">{t.title}</div>
                    <div className="text-sm text-[var(--cs-muted)] max-w-[42ch]">{t.desc}</div>
                  </div>
                </div>
                <span className={t.badge.className}>{t.badge.label}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {t.highlights.map((h) => (
                  <span
                    key={h}
                    className={cx(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs",
                      "border border-[var(--cs-border)] bg-white/60"
                    )}
                  >
                    {h}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-[var(--cs-muted)]">
                  Educational only • No product names • No comparisons
                </div>

                {/* One CTA only (no Ask Nigel) */}
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-[var(--cs-border)] bg-white/70 group-hover:bg-white/90 transition">
                  <span className="text-sm font-semibold">Open tool</span>
                  <span className="text-sm" aria-hidden="true">
                    →
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom CTA - less boxy */}
      <div className="relative overflow-hidden rounded-[30px] border border-[var(--cs-border)] bg-white/65 backdrop-blur p-6">
        <div className="absolute -top-28 -right-28 h-64 w-64 rounded-full bg-[rgba(108,92,231,0.12)] blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-[rgba(0,184,148,0.10)] blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Want a quick check-in?</div>
            <div className="text-sm text-[var(--cs-muted)] mt-1">
              If you’d like a personalised review, request a chat — I’ll follow up.
            </div>
          </div>
          <a
            className="cs-btn cs-btn-primary"
            href={`/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent(
              "I’d like a personalised review of my current situation."
            )}`}
          >
            Request a chat
          </a>
        </div>
      </div>
    </div>
  );
}

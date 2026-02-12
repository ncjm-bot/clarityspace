import Link from "next/link";
import React from "react";

type InsightCard = {
  title: string;
  desc: string;
  tag: string;
  status: "Coming soon" | "Live";
};

export default function InsightsPage() {
  const cards: InsightCard[] = [
    {
      title: "How to think about your emergency buffer (without stress)",
      desc: "A simple way to estimate runway, and what “safe” can look like depending on your life stage.",
      tag: "Basics",
      status: "Coming soon",
    },
    {
      title: "Protection gaps: what matters first (and what can wait)",
      desc: "A clean priority order so you don’t feel pressured to do everything at once.",
      tag: "Protection",
      status: "Coming soon",
    },
    {
      title: "Retirement planning in plain English",
      desc: "A simple mental model: goal, gap, set-aside — and how to keep it realistic.",
      tag: "Long-term",
      status: "Coming soon",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="cs-animate-in relative overflow-hidden rounded-[34px] border border-[var(--cs-border)] bg-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.16)] blur-3xl" />
        <div className="absolute -bottom-44 -right-40 h-[560px] w-[560px] rounded-full bg-[rgba(108,92,231,0.18)] blur-3xl" />

        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge cs-badge-good">Insights</span>
                <span className="cs-badge">Short + practical</span>
                <span className="cs-badge">Plain English</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                Small notes for clearer decisions
              </h1>

              <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
                Short reads about buffers, protection, and long-term planning — written to be simple and calm.
                No product comparisons. No pressure.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link className="cs-btn cs-btn-primary" href="/tools">
                  Explore tools
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/contact">
                  Request a topic
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/disclaimer">
                  Disclaimer
                </Link>
              </div>
            </div>

            <div className="cs-card-hero p-5 rounded-[26px] max-w-xl">
              <div className="text-sm font-semibold">Follow along</div>
              <div className="mt-1 text-sm text-[var(--cs-muted)] leading-relaxed">
                I’ll drop updates here over time. If you want, follow my Instagram for the latest.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="cs-btn cs-btn-ghost text-sm"
                  href="https://instagram.com/nigel.cjm"
                  target="_blank"
                  rel="noreferrer"
                >
                  @nigel.cjm →
                </a>
                <Link className="cs-btn cs-btn-primary text-sm" href="/contact">
                  Request a chat
                </Link>
              </div>
              <div className="mt-3 text-xs text-[var(--cs-muted)]">
                General information only. Not financial advice.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-fade-up grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="group rounded-[28px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-6 shadow-[0_10px_32px_rgba(15,43,31,0.06)] hover:shadow-[0_16px_44px_rgba(15,43,31,0.10)] transition"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="cs-badge">{c.tag}</span>
              <span className="cs-badge cs-badge-warn">{c.status}</span>
            </div>

            <div className="mt-4 text-lg font-semibold tracking-tight">{c.title}</div>
            <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">{c.desc}</div>

            <div className="mt-5 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-4">
              <div className="text-sm font-semibold">Want this topic first?</div>
              <div className="mt-1 text-sm text-[var(--cs-muted)]">
                Send me a quick request and I’ll prioritise it.
              </div>
              <div className="mt-3">
                <Link className="cs-btn cs-btn-primary text-sm w-full" href="/contact">
                  Request a topic
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="text-xs text-[var(--cs-muted)] leading-relaxed">
        General information only. Not financial advice and not a product recommendation.
      </section>
    </div>
  );
}

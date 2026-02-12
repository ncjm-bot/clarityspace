import Link from "next/link";
import React from "react";

export default function StoryPage() {
  const storyPoints = [
    {
      title: "Money feels complicated",
      body: "Most people don’t avoid planning because they don’t care. They avoid it because it feels confusing, overwhelming, or sales-driven.",
      tag: "Reality",
    },
    {
      title: "Pressure kills clarity",
      body: "When conversations feel rushed or product-heavy, people shut down. Decisions made under pressure rarely feel good long-term.",
      tag: "Observation",
    },
    {
      title: "Tools create calm",
      body: "When someone can quietly see their own numbers first — without judgement — the conversation becomes clearer and more productive.",
      tag: "Solution",
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
                <span className="cs-badge cs-badge-good">Clarity Space</span>
                <span className="cs-badge">#GRWN</span>
                <span className="cs-badge">Why it exists</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                <span className="cs-shimmer">Why I built Clarity Space</span>
              </h1>

              <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
                I wanted a space where financial planning feels calm, not intimidating.
                Where people can understand where they stand — before anyone talks about products.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link className="cs-btn cs-btn-primary" href="/tools">
                  Explore tools
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/contact">
                  Request a chat
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/disclaimer">
                  Disclaimer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-fade-up grid gap-6 lg:grid-cols-3">
        {storyPoints.map((point) => (
          <details
            key={point.title}
            className="cs-details group rounded-[28px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-6 shadow-[0_10px_32px_rgba(15,43,31,0.06)] hover:shadow-[0_16px_44px_rgba(15,43,31,0.10)] transition"
          >
            <summary className="cs-details cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--cs-muted)]">
                    {point.tag}
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-tight">
                    {point.title}
                  </div>
                </div>

                <span className="text-sm opacity-60 group-open:rotate-180 transition">
                  ↓
                </span>
              </div>
            </summary>

            <div className="mt-4 text-sm text-[var(--cs-muted)] leading-relaxed">
              {point.body}
            </div>
          </details>
        ))}
      </section>

      <section className="cs-pop rounded-[30px] border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-8">
        <div className="text-2xl font-bold tracking-tight">
          The philosophy
        </div>

        <div className="mt-4 max-w-3xl text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
          Clarity Space is built on a simple belief:
          clarity reduces stress.
          <br /><br />
          When someone sees their buffer, protection gaps, or retirement target clearly,
          they don’t feel pressured — they feel informed.
          <br /><br />
          That changes the tone of everything.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="cs-badge">Tools first</span>
          <span className="cs-badge">No pressure</span>
          <span className="cs-badge">Education only</span>
          <span className="cs-badge">Plain English</span>
        </div>
      </section>

      <section className="cs-fade-up grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="cs-card p-8 rounded-[30px]">
          <div className="text-xl font-semibold tracking-tight">
            This page will grow.
          </div>

          <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
            Over time, I’ll add short reflections —
            lessons from real conversations,
            improvements to the tools,
            and thoughts about planning in a changing world.
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link className="cs-btn cs-btn-ghost" href="/insights">
              Read insights
            </Link>
            <Link className="cs-btn cs-btn-primary" href="/contact">
              Start a conversation
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-[var(--cs-border)] bg-white/70 backdrop-blur p-8">
          <div className="absolute -top-28 -right-28 h-64 w-64 rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-[rgba(108,92,231,0.14)] blur-3xl" />

          <div className="relative">
            <div className="text-sm font-semibold">
              What matters most
            </div>

            <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
              Not selling.
              <br />
              Not impressing.
              <br />
              Not overwhelming.
              <br /><br />
              Just helping someone feel clearer than they did yesterday.
            </div>
          </div>
        </div>
      </section>

      <section className="text-xs text-[var(--cs-muted)] leading-relaxed">
        General information only. Not financial advice and not a product recommendation.
      </section>
    </div>
  );
}

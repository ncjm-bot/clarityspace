import Link from "next/link";
import React from "react";

type Testimonial = {
  name: string;
  context: string;
  quote: string;
  tag: string;
  status?: "Coming soon";
};

export default function TestimonialsPage() {
  const items: Testimonial[] = [
    {
      name: "Coming soon",
      context: "General clarity session",
      quote:
        "This page will be updated with real experiences over time. I’ll keep it honest, simple, and respectful.",
      tag: "Placeholder",
      status: "Coming soon",
    },
    {
      name: "Coming soon",
      context: "Tools walkthrough",
      quote:
        "If you’ve used Clarity Space and want to share feedback, you can send it through the contact page.",
      tag: "Feedback",
      status: "Coming soon",
    },
    {
      name: "Coming soon",
      context: "Follow-up chat",
      quote:
        "No pressure. Just clarity. I’ll summarise what we discussed in plain English so you can think at your own pace.",
      tag: "Process",
      status: "Coming soon",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="cs-animate-in relative overflow-hidden rounded-[34px] border border-[var(--cs-border)] bg-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.16)] blur-3xl" />
        <div className="absolute -bottom-44 -right-40 h-[560px] w-[560px] rounded-full bg-[rgba(108,92,231,0.18)] blur-3xl" />

        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge cs-badge-good">Testimonials</span>
                <span className="cs-badge">Real experiences</span>
                <span className="cs-badge">No exaggeration</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                What people say
              </h1>

              <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
                This section will grow over time. If you’d like to share feedback, you can send it through Contact.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link className="cs-btn cs-btn-primary" href="/contact">
                  Share feedback
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/tools">
                  Explore tools
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/disclaimer">
                  Disclaimer
                </Link>
              </div>
            </div>

            <div className="cs-card-hero p-5 rounded-[26px] max-w-xl">
              <div className="text-sm font-semibold">Note</div>
              <div className="mt-1 text-sm text-[var(--cs-muted)] leading-relaxed">
                Experiences vary. Any feedback shared here is personal experience, not a guarantee of outcome.
              </div>
              <div className="mt-3 text-xs text-[var(--cs-muted)]">
                General information only. Not financial advice.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-fade-up grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, idx) => (
          <div
            key={`${t.tag}-${idx}`}
            className="rounded-[28px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-6 shadow-[0_10px_32px_rgba(15,43,31,0.06)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="cs-badge">{t.tag}</span>
              {t.status ? <span className="cs-badge cs-badge-warn">{t.status}</span> : null}
            </div>

            <div className="mt-4 text-sm font-semibold">{t.context}</div>
            <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
              “{t.quote}”
            </div>

            <div className="mt-6 border-t border-[var(--cs-border)] pt-4 flex items-center justify-between">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-[var(--cs-muted)]">—</div>
            </div>
          </div>
        ))}
      </section>

      <section className="text-xs text-[var(--cs-muted)] leading-relaxed">
        General information only. Not financial advice and not a product recommendation. Experiences vary and do not guarantee outcomes.
      </section>
    </div>
  );
}

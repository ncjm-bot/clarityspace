import Image from "next/image";
import React from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function HomePage() {
  const phoneDisplay = "9862 7722";
  const phoneHref = "tel:+6598627722";
  const email = "nigelchuajm@pruadviser.com.sg";
  const igHandle = "@nigel.cjm";
  const igHref = "https://instagram.com/nigel.cjm";

  const scope = [
    "Protection planning",
    "Retirement planning",
    "Investment planning",
    "Education funding",
    "Cashflow & budgeting clarity",
    "Estate planning (discussion + direction)",
    "Mortgage / loan protection (discussion + direction)",
    "Business risk planning (discussion + direction)",
    "Tax planning (general discussion)",
  ];

  return (
    <div className="space-y-10">
      <section
        className={cx(
          "relative overflow-hidden rounded-[34px] border border-[var(--cs-border)]",
          "bg-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.06)]"
        )}
      >
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
        <div className="absolute -bottom-44 -right-40 h-[560px] w-[560px] rounded-full bg-[rgba(108,92,231,0.18)] blur-3xl" />

        <div className="relative p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-center">
            <div className="order-2 lg:order-1 space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge">Nigel Chua</span>
                <span className="cs-badge">Financial Consultant</span>
                <span className="cs-badge">#GRWN</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
                Clarity-first financial planning
              </h1>

              <p className="text-[var(--cs-muted)] text-base sm:text-lg max-w-2xl leading-relaxed">
                I keep things simple and human: understand where you stand, spot blind spots, then decide what to do next.
                If you prefer, you can use my tools quietly — no pressure.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <a className="cs-btn cs-btn-primary" href="/contact">
                  Request a chat
                </a>
                <a className="cs-btn cs-btn-ghost" href="/story">
                  View my story
                </a>
                <a className="cs-btn cs-btn-ghost" href="/tools">
                  Explore tools
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-4">
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                  <div className="text-sm font-semibold">How I work</div>
                  <div className="text-sm text-[var(--cs-muted)] mt-1 leading-relaxed">
                    Start with clarity → then an optional conversation. No pushing, no rush.
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                  <div className="text-sm font-semibold">What you’ll get</div>
                  <div className="text-sm text-[var(--cs-muted)] mt-1 leading-relaxed">
                    A clean snapshot of priorities, gaps, and next steps you can understand.
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-[28px] border border-[var(--cs-border)] bg-white/80 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">Nigel Chua Jian Ming</div>
                    <div className="text-xs text-[var(--cs-muted)] truncate">
                      Representative, Prudential Assurance Company Singapore (Pte) Ltd
                    </div>
                  </div>
                  <a
                    className="cs-btn cs-btn-ghost text-sm"
                    href="/disclaimer"
                  >
                    Disclaimer
                  </a>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr] items-center">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] border border-[var(--cs-border)] bg-[color:var(--cs-card)/0.6]">
                    <Image
                      src="/personal-picture.jpg"
                      alt="Nigel Chua"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 520px"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--cs-border)] bg-white/90 p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Phone</div>
                      <a className="text-sm font-semibold hover:underline" href={phoneHref}>
                        {phoneDisplay}
                      </a>
                    </div>

                    <div className="rounded-2xl border border-[var(--cs-border)] bg-white/90 p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Email</div>
                      <a className="text-sm font-semibold hover:underline" href={`mailto:${email}`}>
                        {email}
                      </a>
                    </div>

                    <div className="rounded-2xl border border-[var(--cs-border)] bg-white/90 p-4">
                      <div className="text-xs text-[var(--cs-muted)]">Instagram</div>
                      <a
                        className="text-sm font-semibold hover:underline"
                        href={igHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {igHandle}
                      </a>
                    </div>

                    <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
                      Educational tools are available via the “Tools” tab. If you want, you can send me your results for a quick review.
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
                  <div className="text-sm font-semibold">Personal mission</div>
                  <div className="text-sm text-[var(--cs-muted)] mt-1 leading-relaxed">
                    I aim to serve with compassion and integrity — growing alongside my clients as we work towards securing their
                    financial and personal well-being, so they feel protected, empowered, and informed every step of the way.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cs-card p-6 rounded-[26px]">
          <div className="text-sm font-semibold">What I help with</div>
          <div className="text-sm text-[var(--cs-muted)] mt-2 leading-relaxed">
            Practical planning around protection, cashflow, and longer-term goals — explained in plain language.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {scope.slice(0, 5).map((s) => (
              <span key={s} className="cs-badge">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="cs-card p-6 rounded-[26px]">
          <div className="text-sm font-semibold">Tools (optional)</div>
          <div className="text-sm text-[var(--cs-muted)] mt-2 leading-relaxed">
            Quick self-checks to help you get a clearer snapshot first. No product names, no comparisons.
          </div>
          <div className="mt-4 flex gap-2">
            <a className="cs-btn cs-btn-primary" href="/tools">
              Open tools
            </a>
            <a className="cs-btn cs-btn-ghost" href="/contact">
              Ask a question
            </a>
          </div>
        </div>

        <div className="cs-card p-6 rounded-[26px]">
          <div className="text-sm font-semibold">No-pressure promise</div>
          <div className="text-sm text-[var(--cs-muted)] mt-2 leading-relaxed">
            If you’re not ready to talk, totally fine. Use what you need and move at your own pace.
          </div>
          <div className="mt-4 flex gap-2">
            <a className="cs-btn cs-btn-ghost" href="/disclaimer">
              Read disclaimer
            </a>
            <a className="cs-btn cs-btn-ghost" href="/testimonials">
              Testimonials
            </a>
          </div>
        </div>
      </section>

      <section className="cs-card p-8 rounded-[30px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-2xl font-bold">Scope of planning</div>
            <div className="text-sm text-[var(--cs-muted)] mt-1">
              Areas I can discuss and help you make sense of, based on your goals and situation.
            </div>
          </div>
          <a className="cs-btn cs-btn-primary" href="/contact">
            Request a chat
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scope.map((s) => (
            <div
              key={s}
              className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4 text-sm"
            >
              <div className="font-semibold">{s}</div>
              <div className="text-xs text-[var(--cs-muted)] mt-1">
                General discussion and guidance — tailored to your context.
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-[var(--cs-muted)] leading-relaxed">
          General information only. Not financial advice and not a product recommendation. Tools provide estimates and simplified scenarios.
        </div>
      </section>

      <section className="text-xs text-[var(--cs-muted)] leading-relaxed">
        Disclaimer for Financial Consultants (Affiliated with PACS):{" "}
        <a className="hover:underline" href="https://www.prudential.com.sg/FC-info" target="_blank" rel="noreferrer">
          https://www.prudential.com.sg/FC-info
        </a>
      </section>
    </div>
  );
}

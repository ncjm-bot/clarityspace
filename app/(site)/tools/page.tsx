export default function ToolsPage() {
  const tools = [
    {
      key: "resilience",
      title: "Resilience Score",
      desc: "Quick educational self-check to spot pressure points (buffer months, shock gap, dependents impact).",
      badge: { label: "CORE", className: "cs-badge cs-badge-good" },
      href: "/tools/resilience",
      highlights: ["Buffer months", "6-month shock gap", "Dependents impact"],
    },
    {
      key: "protection",
      title: "Protection Gap Check",
      desc: "Simple coverage vs needs snapshot across Death / TPD / CI (no product names, no comparisons).",
      badge: { label: "NEXT", className: "cs-badge cs-badge-warn" },
      href: "/tools/protection",
      highlights: ["Death / TPD / CI", "Coverage shortfall", "Educational only"],
    },
    {
      key: "education",
      title: "Education Goal Planner",
      desc: "Estimate a child education target and what you may need to set aside yearly (assumptions-based).",
      badge: { label: "PLANNED", className: "cs-badge cs-badge-warn" },
      href: "/tools/education",
      highlights: ["Goal target", "Time horizon", "Growth assumption"],
    },
    {
      key: "retirement",
      title: "Retirement Readiness",
      desc: "Estimate a retirement target, potential shortfall, and a simple savings path (assumptions-based).",
      badge: { label: "PLANNED", className: "cs-badge cs-badge-warn" },
      href: "/tools/retirement",
      highlights: ["Retirement target", "Gap view", "Savings path"],
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-[var(--cs-muted)] max-w-2xl">
          Educational self-check tools to help you understand common planning blind spots.
          No product names, no comparisons, no recommendations.
        </p>
      </div>

      <div className="cs-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Quick disclaimer</div>
            <div className="text-sm text-[var(--cs-muted)] mt-1">
              General information only. Results are estimates and do not replace a personalised review.
            </div>
          </div>
          <a className="cs-btn cs-btn-ghost" href="/privacy">
            Read disclaimer
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => {
          const cardInner = (
            <div className="cs-card p-6 h-full flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xl font-bold">{t.title}</div>
                  <div className="text-sm text-[var(--cs-muted)]">{t.desc}</div>
                </div>
                <span className={t.badge.className}>{t.badge.label}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {t.highlights.map((h) => (
                  <span key={h} className="cs-badge">
                    {h}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                {t.disabled ? (
                  <>
                    <span className="cs-btn cs-btn-ghost w-full text-center opacity-60 cursor-not-allowed">
                      Coming soon
                    </span>
                    <a className="cs-btn cs-btn-ghost" href={`/contact?tool=${encodeURIComponent(t.key)}&summary=${encodeURIComponent("Interested in this tool — please notify me when it’s ready.")}`}>
                      Notify me
                    </a>
                  </>
                ) : (
                  <>
                    <a className="cs-btn cs-btn-primary w-full" href={t.href}>
                      Open tool
                    </a>
                    <a
                      className="cs-btn cs-btn-ghost"
                      href={`/contact?tool=${encodeURIComponent(t.key)}&summary=${encodeURIComponent("I’d like a quick personalised walkthrough after using the tool.")}`}
                    >
                      Ask Nigel
                    </a>
                  </>
                )}
              </div>
            </div>
          );

          return t.disabled ? (
            <div key={t.key} className="opacity-90">
              {cardInner}
            </div>
          ) : (
            <div key={t.key}>{cardInner}</div>
          );
        })}
      </div>

      <div className="cs-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Want a quick check-in?</div>
            <div className="text-sm text-[var(--cs-muted)] mt-1">
              If you’d like a personalised review, you can request a chat — I’ll follow up.
            </div>
          </div>
          <a
            className="cs-btn cs-btn-primary"
            href={`/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent("I’d like a personalised review of my current situation.")}`}
          >
            Request a chat
          </a>
        </div>
      </div>
    </div>
  );
}

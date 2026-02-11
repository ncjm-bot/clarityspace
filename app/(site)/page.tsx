export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="cs-card p-8">
        <div className="max-w-2xl space-y-3">
          <div className="text-sm text-[var(--cs-muted)] font-semibold">Nigel’s Clarity Space • #GRWN</div>
          <h1 className="text-4xl font-bold leading-tight">
            Simple self-check tools to spot blind spots early.
          </h1>
          <p className="text-[var(--cs-muted)]">
            Educational only — no recommendations, no product names, no comparisons.
            Just clarity, so you know what questions to ask next.
          </p>

          <div className="pt-3 flex flex-wrap gap-2">
            <a className="cs-btn cs-btn-primary" href="/tools">
              Explore tools
            </a>
            <a
              className="cs-btn cs-btn-ghost"
              href={`/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent("I’d like a quick chat to understand where I stand.")}`}
            >
              Request a chat
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="cs-card p-6">
          <div className="text-sm font-semibold">Educational</div>
          <div className="text-sm text-[var(--cs-muted)] mt-1">
            Built to help you understand concepts, not to sell you anything.
          </div>
        </div>
        <div className="cs-card p-6">
          <div className="text-sm font-semibold">Fast</div>
          <div className="text-sm text-[var(--cs-muted)] mt-1">
            Most tools take under 60 seconds for a quick snapshot.
          </div>
        </div>
        <div className="cs-card p-6">
          <div className="text-sm font-semibold">Clear follow-up</div>
          <div className="text-sm text-[var(--cs-muted)] mt-1">
            If you want, request a chat and I’ll walk you through what it means.
          </div>
        </div>
      </div>

      <div className="text-xs text-[var(--cs-muted)]">
        General information only. Not financial advice or a product recommendation.
      </div>
    </div>
  );
}

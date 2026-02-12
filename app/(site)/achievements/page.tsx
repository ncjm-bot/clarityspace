export const dynamic = "force-dynamic";

type Achievement = {
  title: string;
  subtitle: string;
  year?: string;
  tags: string[];
};

const achievements: Achievement[] = [
  {
    title: "NSF Council — Vice President",
    subtitle: "Led presentations, coordinated stakeholders, and supported council planning across teams.",
    year: "2023–2024",
    tags: ["Leadership", "Stakeholder liaison", "Presentations"],
  },
  {
    title: "Financial Consultant (PACS)",
    subtitle: "Building Nigel’s Clarity Space — simple tools + calm, no-pressure conversations.",
    year: "2025–Present",
    tags: ["Client service", "Clarity-first", "#GRWN"],
  },
  {
    title: "University Projects & Systems Build",
    subtitle: "Hands-on work across product thinking, delivery, and continuous improvement.",
    year: "Ongoing",
    tags: ["Execution", "Iteration", "Systems"],
  },
];

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function Badge(props: { children: React.ReactNode; tone?: "mint" | "violet" | "neutral" }) {
  const tone =
    props.tone === "mint"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : props.tone === "violet"
      ? "bg-violet-50 border-violet-100 text-violet-800"
      : "bg-white/70 border-[var(--cs-border)] text-[var(--cs-text)]";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", tone)}>
      {props.children}
    </span>
  );
}

export default function AchievementsPage() {
  return (
    <div className="space-y-7">
      <section className="cs-animate-in relative overflow-hidden rounded-[30px] border border-[var(--cs-border)] bg-white/70 shadow-[0_14px_44px_rgba(15,43,31,0.08)]">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
        <div className="absolute -bottom-44 -right-40 h-[560px] w-[560px] rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />

        <div className="relative p-7 sm:p-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="mint">Growth</Badge>
              <Badge tone="violet">Credibility</Badge>
              <Badge>Real milestones</Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Achievements</h1>

            <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed max-w-3xl">
              A living page — I’ll keep adding milestones as I grow. Short, real, and easy to scan.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <a className="cs-btn cs-btn-ghost text-sm" href="/story">
                View my story
              </a>
              <a className="cs-btn cs-btn-primary text-sm" href="/contact">
                Request a chat
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-[var(--cs-border)] bg-white/70 backdrop-blur p-7 shadow-[0_14px_44px_rgba(15,43,31,0.08)]">
          <div className="text-sm font-semibold">Highlights</div>
          <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
            Leadership + client care + building systems that scale.
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
              <div className="text-xs text-[var(--cs-muted)]">Style</div>
              <div className="text-sm font-semibold">Calm, clear, no pressure</div>
            </div>
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
              <div className="text-xs text-[var(--cs-muted)]">Focus</div>
              <div className="text-sm font-semibold">Clarity → action → consistency</div>
            </div>
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white/80 p-4">
              <div className="text-xs text-[var(--cs-muted)]">Promise</div>
              <div className="text-sm font-semibold">You can always say “Not now.”</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-[30px] border border-[var(--cs-border)] bg-white/70 backdrop-blur p-7 shadow-[0_14px_44px_rgba(15,43,31,0.08)]">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold">Timeline</div>
              <div className="mt-1 text-sm text-[var(--cs-muted)]">
                Simple cards — easy to update later with new chapters.
              </div>
            </div>
            <a className="cs-btn cs-btn-ghost text-sm" href="/contact">
              Add / verify details
            </a>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.title}
                className="group rounded-[26px] border border-[var(--cs-border)] bg-white/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.06)] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold tracking-tight">{a.title}</div>
                    {a.year ? <div className="text-xs text-[var(--cs-muted)] mt-1">{a.year}</div> : null}
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[var(--cs-border)] bg-[var(--cs-card)]/70 px-3 py-1 text-xs text-[var(--cs-muted)]">
                    Updated
                  </span>
                </div>

                <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">{a.subtitle}</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-[var(--cs-border)] bg-white/70 px-3 py-1 text-xs text-[var(--cs-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/60 p-5">
            <div className="text-sm font-semibold">Want this page to feel more “alive”?</div>
            <div className="mt-1 text-sm text-[var(--cs-muted)] leading-relaxed">
              Next upgrade: add photos, mini-stories, and “what I learned” under each milestone (still short, still clean).
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

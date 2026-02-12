"use client";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";

type SourceLink = { label: string; href: string };

type StoryCategory =
  | "Clarity Insight"
  | "CPF Insight"
  | "Personal Reflection"
  | "Singapore Context"
  | "Budget";

type Story = {
  id: string;
  title: string;
  slug: string;
  category: StoryCategory;
  dateLabel: string;
  readingMins: number;
  excerpt: string;
  keyPoints: string[];
  sources?: SourceLink[];
};

const CATEGORY_META: Record<
  StoryCategory,
  { badge: string; dot: string; tint: string }
> = {
  Budget: {
    badge: "cs-badge",
    dot: "bg-[rgba(253,203,110,0.85)]",
    tint: "bg-[rgba(253,203,110,0.14)]",
  },
  "Singapore Context": {
    badge: "cs-badge",
    dot: "bg-[rgba(116,185,255,0.85)]",
    tint: "bg-[rgba(116,185,255,0.14)]",
  },
  "Personal Reflection": {
    badge: "cs-badge",
    dot: "bg-[rgba(250,177,160,0.90)]",
    tint: "bg-[rgba(250,177,160,0.16)]",
  },
  "CPF Insight": {
    badge: "cs-badge",
    dot: "bg-[rgba(108,92,231,0.85)]",
    tint: "bg-[rgba(108,92,231,0.14)]",
  },
  "Clarity Insight": {
    badge: "cs-badge cs-badge-good",
    dot: "bg-[rgba(0,184,148,0.85)]",
    tint: "bg-[rgba(0,184,148,0.12)]",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampText(text: string, max = 160) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function safeHost(href: string) {
  try {
    const u = new URL(href);
    return u.hostname.replace("www.", "");
  } catch {
    return "source";
  }
}

export default function StoryPage() {
  const stories: Story[] = [
    {
      id: "budget-2026",
      title: "Budget 2026 — Have you seen this?",
      slug: "budget-2026-highlights",
      category: "Budget",
      dateLabel: "Feb",
      readingMins: 3,
      excerpt:
        "A quick list of household-focused Budget 2026 items people might miss — so you can note what applies and ignore what doesn’t.",
      keyPoints: [
        "CDC vouchers and targeted credits may apply depending on household profile.",
        "Different payouts/benefits have different timelines (some in 2026, some later).",
        "Eligibility differs — refer to official sources for your household’s position.",
      ],
      sources: [
        {
          label: "The Straits Times (Budget coverage)",
          href: "https://www.straitstimes.com/singapore/budget-2026-500-cdc-vouchers-for-all-singaporean-households-in-jan-2027",
        },
        {
          label: "The Straits Times (kids / LifeSG credits coverage)",
          href: "https://www.straitstimes.com/singapore/budget-2026-500-child-lifesg-credits-for-s-poreans-kids-under-12-more-to-get-pre-school-subsidies",
        },
      ],
    },
    {
      id: "sg-health-awareness",
      title: "Singapore Context — Health Awareness",
      slug: "singapore-context-health-awareness",
      category: "Singapore Context",
      dateLabel: "Jan",
      readingMins: 3,
      excerpt:
        "A local reminder that health risks don’t always follow age or “perfect timing”. Not shared to alarm — just to encourage earlier attention to symptoms and check-ups.",
      keyPoints: [
        "Awareness matters: earlier attention can change outcomes.",
        "Don’t normalize persistent symptoms just because life is busy.",
        "Use official medical advice and screenings as your anchor.",
      ],
      sources: [
        {
          label: "The Straits Times (local reporting)",
          href: "https://www.straitstimes.com/singapore/health/more-young-adults-teens-in-singapore-being-diagnosed-with-cancer",
        },
      ],
    },
    {
      id: "when-life-doesnt-pause",
      title: "Personal Reflection — When Life Doesn’t Pause",
      slug: "personal-reflection-when-life-doesnt-pause",
      category: "Personal Reflection",
      dateLabel: "Jan",
      readingMins: 4,
      excerpt:
        "A reminder that planning isn’t about perfect timing. When life throws a curveball, stability often comes from having a buffer and knowing your options.",
      keyPoints: [
        "A financial cushion doesn’t remove stress, but it can reduce one layer of pressure.",
        "Responsibilities keep moving even during uncertainty.",
        "Clarity helps decisions feel less rushed and less reactive.",
      ],
      sources: [
        {
          label: "CNA (referenced reflection article)",
          href: "https://www.channelnewsasia.com/today/voices/brain-tumour-family-business-curry-puff-health-insurance-financial-planning-5770856",
        },
      ],
    },
    {
      id: "careshield-2026",
      title: "CPF Insight — CareShield Life Enhancements (2026)",
      slug: "cpf-careshield-life-enhancements-2026",
      category: "CPF Insight",
      dateLabel: "Dec 30",
      readingMins: 3,
      excerpt:
        "Updates shared by the CPF Board: higher monthly payouts for valid claims due to severe disability from 1 Jan 2026, with payouts continuing to increase over time.",
      keyPoints: [
        "From 1 Jan 2026, monthly payouts under CareShield Life will be enhanced for eligible claims.",
        "Payouts continue to increase annually (as set out under the scheme’s design).",
        "Premiums rise over time, but can be paid using MediSave; support measures may apply.",
      ],
      sources: [{ label: "CPF Board (official updates)", href: "https://www.cpf.gov.sg/" }],
    },
    {
      id: "ip-rider-2026",
      title: "Hospitalization Insight #1 — IP Rider Changes (2026)",
      slug: "hospitalization-ip-rider-changes-2026",
      category: "Clarity Insight",
      dateLabel: "Nov 30",
      readingMins: 3,
      excerpt:
        "MOH announced changes affecting new Integrated Shield Plan riders from 1 Apr 2026. Premiums may be lower, but you’ll take on a higher share of the first part of your bill.",
      keyPoints: [
        "New riders can’t cover the minimum deductible anymore.",
        "Annual co-payment cap for new riders increases (with minimum 5% co-pay retained).",
        "Premiums for new riders are expected to be lower on average, but out-of-pocket during claims is higher.",
      ],
      sources: [
        {
          label: "MOH: New requirements for Integrated Shield Plan riders",
          href: "https://www.moh.gov.sg/newsroom/new-requirements-for-integrated-shield-plan-riders-to-strengthen-sustainability-of-private-health-insurance-and-address-rising-healthcare-costs/",
        },
      ],
    },
  ];

  const allCategories = useMemo(() => {
    const set = new Set<StoryCategory>();
    stories.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [stories]);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<StoryCategory | "All">("All");
  const [activeIndex, setActiveIndex] = useState(0);

  const railRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories
      .filter((s) => (activeCategory === "All" ? true : s.category === activeCategory))
      .filter((s) => {
        if (!q) return true;
        const hay = [
          s.title,
          s.category,
          s.excerpt,
          ...s.keyPoints,
          ...(s.sources?.map((x) => x.label) ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [stories, query, activeCategory]);

  const latest = filtered[0] || stories[0];

  return (
    <div className="space-y-10">

      {/* HERO */}
      <section className="cs-animate-in relative overflow-hidden rounded-[34px] border border-[var(--cs-border)] bg-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
        <div className="absolute -top-44 -left-44 h-[560px] w-[560px] rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
        <div className="absolute -bottom-52 -right-48 h-[620px] w-[620px] rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />

        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="cs-badge cs-badge-good">Clarity Space</span>
                <span className="cs-badge">#GRWN</span>
                <span className="cs-badge">Stories</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                <span className="cs-shimmer">Bite-sized clarity.</span>
              </h1>

              <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed">
                Short posts with key takeaways + source links. Built for skimming — and revisiting.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link className="cs-btn cs-btn-primary" href="/contact">
                  Contact
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/tools">
                  Explore tools
                </Link>
                <Link className="cs-btn cs-btn-ghost" href="/disclaimer">
                  Disclaimer
                </Link>
              </div>
            </div>

            {/* Search + filter */}
            <div className="w-full lg:max-w-[520px]">
              <div className="rounded-[26px] border border-[var(--cs-border)] bg-white/70 backdrop-blur p-5 shadow-[0_10px_32px_rgba(15,43,31,0.06)]">
                <div className="text-sm font-semibold tracking-tight">Find a story</div>

                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-[18px] border border-[var(--cs-border)] bg-white/70 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--cs-muted)] opacity-60" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                        const rail = railRef.current;
                        if (rail) rail.scrollTo({ left: 0, behavior: "auto" });
                      }}
                      placeholder="Search topic, keyword, source…"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--cs-muted)]"
                      aria-label="Search stories"
                    />
                    {query ? (
                      <button
                        onClick={() => {
                          setQuery("");
                          setActiveIndex(0);
                          const rail = railRef.current;
                          if (rail) rail.scrollTo({ left: 0, behavior: "smooth" });
                        }}
                        className="cs-btn cs-btn-ghost !px-3 !py-2"
                        aria-label="Clear search"
                        type="button"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory("All");
                        setActiveIndex(0);
                        const rail = railRef.current;
                        if (rail) rail.scrollTo({ left: 0, behavior: "smooth" });
                      }}
                      className={cx(
                        "cs-btn cs-btn-ghost !px-4 !py-2",
                        activeCategory === "All" && "cs-btn-primary"
                      )}
                    >
                      All
                    </button>

                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat);
                          setActiveIndex(0);
                          const rail = railRef.current;
                          if (rail) rail.scrollTo({ left: 0, behavior: "smooth" });
                        }}
                        className={cx(
                          "cs-btn cs-btn-ghost !px-4 !py-2",
                          activeCategory === cat && "cs-btn-primary"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-[var(--cs-muted)]">
                    Showing <span className="font-semibold">{filtered.length}</span>{" "}
                    {filtered.length === 1 ? "story" : "stories"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LATEST SPOTLIGHT */}
          {latest ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden rounded-[32px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-7 shadow-[0_16px_44px_rgba(15,43,31,0.10)]">
                <div className="absolute -top-28 -right-28 h-72 w-72 rounded-full bg-[rgba(0,184,148,0.10)] blur-3xl" />
                <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[rgba(108,92,231,0.10)] blur-3xl" />

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={CATEGORY_META[latest.category].badge}>{latest.category}</span>
                    <span className="cs-badge">{latest.dateLabel}</span>
                    <span className="cs-badge">{latest.readingMins} min</span>
                    <span className="cs-badge">Latest</span>
                  </div>

                  <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                    {latest.title}
                  </div>

                  <div className="mt-3 text-sm sm:text-base text-[var(--cs-muted)] leading-relaxed">
                    {latest.excerpt}
                  </div>

                  <div className={cx("mt-5 rounded-[18px] p-4", CATEGORY_META[latest.category].tint)}>
                    <div className="text-xs font-semibold tracking-tight">Key takeaways</div>
                    <ul className="mt-2 space-y-2">
                      {latest.keyPoints.slice(0, 3).map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[var(--cs-muted)] opacity-60" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link className="cs-btn cs-btn-primary" href={`/insights/${latest.slug}`}>
                      Read
                    </Link>
                    {latest.sources?.[0]?.href ? (
                      <a
                        className="cs-btn cs-btn-ghost"
                        href={latest.sources[0].href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-7">
                <div className="text-sm font-semibold tracking-tight">Format</div>
                <div className="mt-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                  Summary first → 3 takeaways → sources. Same clarity as Telegram, but easier to browse and search.
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="cs-badge">Quick skim</span>
                  <span className="cs-badge">Source links</span>
                  <span className="cs-badge">Plain English</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* STORY REEL (single, premium, no duplicates) */}
      <section className="cs-fade-up">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xl font-semibold tracking-tight">Story reel</div>
            <div className="text-sm text-[var(--cs-muted)]">Swipe sideways. The next card “peeks” in.</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cs-btn cs-btn-ghost !px-4 !py-2"
              onClick={() => {
                const rail = railRef.current;
                if (!rail) return;
                const next = Math.max(0, activeIndex - 1);
                setActiveIndex(next);
                const card = rail.querySelector<HTMLElement>(`[data-idx="${next}"]`);
                card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
              }}
              disabled={activeIndex <= 0}
            >
              ← Prev
            </button>

            <button
              type="button"
              className="cs-btn cs-btn-primary !px-4 !py-2"
              onClick={() => {
                const rail = railRef.current;
                if (!rail) return;
                const next = Math.min(filtered.length - 1, activeIndex + 1);
                setActiveIndex(next);
                const card = rail.querySelector<HTMLElement>(`[data-idx="${next}"]`);
                card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
              }}
              disabled={activeIndex >= filtered.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[rgba(250,250,250,0.95)] to-transparent rounded-l-[28px]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[rgba(250,250,250,0.95)] to-transparent rounded-r-[28px]" />

          <div
            ref={railRef}
            className={cx(
              "flex gap-5 overflow-x-auto pb-2",
              "scroll-smooth",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "snap-x snap-mandatory"
            )}
            onScroll={() => {
              const rail = railRef.current;
              if (!rail) return;
              const items = Array.from(rail.querySelectorAll<HTMLElement>("[data-idx]"));
              if (!items.length) return;

              const railLeft = rail.getBoundingClientRect().left;
              let bestIdx = 0;
              let bestDist = Number.POSITIVE_INFINITY;

              for (const el of items) {
                const idx = Number(el.dataset.idx || 0);
                const left = el.getBoundingClientRect().left;
                const dist = Math.abs(left - railLeft);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestIdx = idx;
                }
              }

              if (bestIdx !== activeIndex) setActiveIndex(bestIdx);
            }}
          >
            {filtered.map((s, idx) => {
              const meta = CATEGORY_META[s.category];
              const isActive = idx === activeIndex;

              return (
                <article
                  key={s.id}
                  data-idx={idx}
                  className={cx(
                    "snap-start shrink-0",
                    "w-[86vw] sm:w-[520px]",
                    "rounded-[28px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-6",
                    "shadow-[0_10px_32px_rgba(15,43,31,0.06)] transition",
                    isActive
                      ? "shadow-[0_18px_52px_rgba(15,43,31,0.12)]"
                      : "opacity-80 hover:opacity-100 hover:shadow-[0_16px_44px_rgba(15,43,31,0.10)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={cx("h-2.5 w-2.5 rounded-full", meta.dot)} />
                      <span className={meta.badge}>{s.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="cs-badge">{s.dateLabel}</span>
                      <span className="cs-badge">{s.readingMins} min</span>
                    </div>
                  </div>

                  <div className="mt-4 text-lg font-semibold tracking-tight leading-snug">
                    {s.title}
                  </div>

                  <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                    {clampText(s.excerpt, 165)}
                  </div>

                  <div className={cx("mt-4 rounded-[18px] p-4", meta.tint)}>
                    <div className="text-xs font-semibold tracking-tight">Key takeaways</div>
                    <ul className="mt-2 space-y-2">
                      {s.keyPoints.slice(0, 3).map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[var(--cs-muted)] opacity-60" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {s.sources?.length ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold tracking-tight">Sources</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.sources.slice(0, 3).map((src) => (
                          <a
                            key={src.href}
                            href={src.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--cs-border)] bg-white/70 px-3 py-2 text-xs hover:bg-white transition"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cs-muted)] opacity-50" />
                            <span className="max-w-[220px] truncate">{safeHost(src.href)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link className="cs-btn cs-btn-primary" href={`/insights/${s.slug}`}>
                      Read
                    </Link>
                    <Link className="cs-btn cs-btn-ghost" href="/contact">
                      Ask
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: Math.max(1, filtered.length) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const rail = railRef.current;
                  if (!rail) return;
                  setActiveIndex(i);
                  const card = rail.querySelector<HTMLElement>(`[data-idx="${i}"]`);
                  card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                }}
                className={cx(
                  "h-2.5 w-2.5 rounded-full transition",
                  i === activeIndex ? "bg-[var(--cs-text)]" : "bg-[var(--cs-muted)] opacity-35"
                )}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ALL POSTS LIST (clean scan) */}
      <section className="cs-fade-up">
        <div className="text-xl font-semibold tracking-tight">All posts</div>
        <div className="mt-1 text-sm text-[var(--cs-muted)]">
          Latest first. Click to read the full post.
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {filtered.map((s) => {
            const meta = CATEGORY_META[s.category];
            return (
              <div
                key={s.id}
                className="rounded-[26px] border border-[var(--cs-border)] bg-white/80 backdrop-blur p-6 shadow-[0_10px_32px_rgba(15,43,31,0.06)] hover:shadow-[0_16px_44px_rgba(15,43,31,0.10)] transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cx("h-2.5 w-2.5 rounded-full", meta.dot)} />
                    <span className={meta.badge}>{s.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="cs-badge">{s.dateLabel}</span>
                    <span className="cs-badge">{s.readingMins} min</span>
                  </div>
                </div>

                <div className="mt-3 text-lg font-semibold tracking-tight leading-snug">
                  {s.title}
                </div>

                <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
                  {clampText(s.excerpt, 170)}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link className="cs-btn cs-btn-primary" href={`/insights/${s.slug}`}>
                    Read
                  </Link>

                  {s.sources?.[0]?.href ? (
                    <a
                      className="cs-btn cs-btn-ghost"
                      href={s.sources[0].href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--cs-muted)]">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="text-xs text-[var(--cs-muted)] leading-relaxed">
        General information only. Not financial advice and not a product recommendation.
      </section>
    </div>
  );
}

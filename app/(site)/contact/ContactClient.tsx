// app/contact/ContactClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

export const dynamic = "force-dynamic";

type Preferred = "WhatsApp" | "Call" | "Telegram";

function normalizeSGMobile(input: string) {
  const digitsOnly = (input || "").replace(/\D/g, "");
  const stripped = digitsOnly.startsWith("65") ? digitsOnly.slice(2) : digitsOnly;
  const isValid = stripped.length === 8 && (stripped.startsWith("8") || stripped.startsWith("9"));
  return { sg8: stripped, isValid };
}

function formatSGMobilePretty(input: string) {
  const digitsOnly = (input || "").replace(/\D/g, "");
  const stripped = digitsOnly.startsWith("65") ? digitsOnly.slice(2) : digitsOnly;
  if (stripped.length <= 4) return stripped;
  return `${stripped.slice(0, 4)} ${stripped.slice(4, 8)}`.trim();
}

function niceToolLabel(tool: string) {
  const t = (tool || "").toLowerCase();
  if (t === "protection") return "Protection Gap Check";
  if (t === "resilience") return "Resilience Score";
  if (t === "education") return "Education Goal Planner";
  if (t === "retirement") return "Retirement Readiness";
  if (t === "general") return "General request";
  return tool || "General request";
}

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function firstInvalidField(args: {
  name: string;
  mobileValid: boolean;
  consent: boolean;
  hasContext: boolean;
  wowConfirmed: boolean;
}) {
  if (args.name.trim().length < 5) return "name";
  if (!args.mobileValid) return "mobile";
  if (!args.consent) return "consent";
  if (args.hasContext && !args.wowConfirmed) return "wow";
  return "";
}

export default function ContactPage() {
  const sp = useSearchParams();
  const tool = sp.get("tool") || "";
  const summary = sp.get("summary") || "";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferred, setPreferred] = useState<Preferred>("WhatsApp");
  const [message, setMessage] = useState("");

  const [consent, setConsent] = useState(false);
  const [showConsentDetails, setShowConsentDetails] = useState(false);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [showWow, setShowWow] = useState(false);
  const [wowConfirmed, setWowConfirmed] = useState(false);

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [touched, setTouched] = useState<{ name: boolean; mobile: boolean; consent: boolean }>({
    name: false,
    mobile: false,
    consent: false,
  });

  const [banner, setBanner] = useState<{
    kind: "info" | "warn";
    text: string;
  } | null>(null);

  const bannerTimer = useRef<number | null>(null);

  const mobileInfo = useMemo(() => normalizeSGMobile(mobile), [mobile]);

  const hasContext = useMemo(() => {
    return Boolean((tool && tool.trim()) || (summary && summary.trim()));
  }, [tool, summary]);

  const toolLabel = useMemo(() => niceToolLabel(tool || "general"), [tool]);

  useEffect(() => {
    if (hasContext) setShowWow(true);
  }, [hasContext]);

  useEffect(() => {
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, []);

  function pushBanner(kind: "info" | "warn", text: string) {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    setBanner({ kind, text });
    bannerTimer.current = window.setTimeout(() => setBanner(null), 2600);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowDisclaimer(false);
        setShowWow(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const nameError = useMemo(() => {
    if (!touched.name) return "";
    if (name.trim().length < 5) return "Please enter your name (at least 5 characters).";
    return "";
  }, [name, touched.name]);

  const mobileError = useMemo(() => {
    if (!touched.mobile) return "";
    if (!mobileInfo.isValid) return "Enter an SG mobile (8 digits, starts with 8 or 9).";
    return "";
  }, [mobileInfo.isValid, touched.mobile]);

  const consentError = useMemo(() => {
    if (!touched.consent) return "";
    if (!consent) return "Please tick the consent box so I can contact you.";
    return "";
  }, [consent, touched.consent]);

  const canSubmit = useMemo(() => {
    const okName = name.trim().length >= 5;
    const okMobile = mobileInfo.isValid;
    const okConsent = consent;
    const okContext = !hasContext || wowConfirmed;
    return okName && okMobile && okConsent && okContext && !sending;
  }, [name, mobileInfo.isValid, consent, hasContext, wowConfirmed, sending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ name: true, mobile: true, consent: true });

    const invalid = firstInvalidField({
      name,
      mobileValid: mobileInfo.isValid,
      consent,
      hasContext,
      wowConfirmed,
    });

    if (invalid === "wow") {
      setShowWow(true);
      pushBanner("warn", "Quick confirm: please confirm the tool summary before sending.");
      return;
    }

    if (invalid === "name") {
      pushBanner("warn", "Please enter your name (min 5 characters).");
      return;
    }

    if (invalid === "mobile") {
      pushBanner("warn", "Please enter a valid Singapore mobile number.");
      return;
    }

    if (invalid === "consent") {
      pushBanner("warn", "Consent is required so I can reach you about this request.");
      return;
    }

    const endpoint = process.env.NEXT_PUBLIC_LEADS_ENDPOINT;
    if (!endpoint) {
      alert("Missing NEXT_PUBLIC_LEADS_ENDPOINT. Your form has nowhere to send to yet.");
      return;
    }

    setSending(true);

    const payload = {
      name: name.trim(),
      mobile: `+65${mobileInfo.sg8}`,
      preferredContact: preferred,
      message: message.trim(),
      tool: tool || "general",
      resultSummary: summary || "",
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      createdAtISO: new Date().toISOString(),
      source: "clarityspace-web",
      consent: {
        contactedForRequest: true,
        timestampISO: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(`Couldn’t send. ${t ? t.slice(0, 160) : "Please try again."}`);
        return;
      }

      setSent(true);
    } catch {
      alert("Something went wrong sending your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const contactHref = `/contact?tool=${encodeURIComponent("general")}&summary=${encodeURIComponent(
    "I’d like a personalised review of my current situation."
  )}`;

  if (sent) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="cs-card p-8 text-center space-y-3">
          <div className="text-2xl font-bold">Request received ✅</div>
          <div className="text-[var(--cs-muted)]">
            Thanks — I’ll reach out via{" "}
            <span className="font-semibold text-[var(--cs-text)]">{preferred}</span>.
          </div>
          <div className="pt-4 flex items-center justify-center gap-2">
            <Link className="cs-btn cs-btn-ghost" href="/tools">
              Back to tools
            </Link>
            <Link className="cs-btn cs-btn-primary" href="/">
              Home
            </Link>
          </div>
          <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
            General information follow-up only. Not financial advice and not a product recommendation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="cs-animate-in relative overflow-hidden rounded-[30px] border border-[var(--cs-border)] bg-white/70 shadow-[0_14px_44px_rgba(15,43,31,0.08)]">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[rgba(0,184,148,0.14)] blur-3xl" />
        <div className="absolute -bottom-44 -right-40 h-[560px] w-[560px] rounded-full bg-[rgba(108,92,231,0.16)] blur-3xl" />

        <div className="relative p-7 sm:p-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="cs-badge cs-badge-good">Request a chat</span>
              <span className="cs-badge">No pressure</span>
              <span className="cs-badge">General info follow-up</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Let’s talk (only if you want)</h1>
            <p className="text-[var(--cs-muted)] text-sm sm:text-base leading-relaxed max-w-3xl">
              Leave your details and I’ll reach out. This is a general information follow-up only — not advice, and not a
              product recommendation.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="cs-btn cs-btn-ghost text-sm"
                onClick={() => setShowDisclaimer(true)}
              >
                Disclaimer
              </button>
              <Link className="cs-btn cs-btn-ghost text-sm" href="/tools">
                Tools
              </Link>
              <Link className="cs-btn cs-btn-ghost text-sm" href={contactHref}>
                Prefill example
              </Link>
            </div>
          </div>
        </div>
      </section>

      {banner ? (
        <div
          className={cx(
            "cs-card px-5 py-4 rounded-[22px]",
            banner.kind === "warn"
              ? "border-rose-200 bg-rose-50/80"
              : "border-[var(--cs-border)] bg-white/70"
          )}
        >
          <div className={cx("text-sm font-semibold", banner.kind === "warn" ? "text-rose-800" : "text-[var(--cs-text)]")}>
            {banner.text}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <div className="space-y-5">
          {hasContext && (
            <div className="cs-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Context I’ll reference</div>
                  <div className="text-sm text-[var(--cs-muted)] mt-1">
                    Tool: <span className="font-medium text-[var(--cs-text)]">{toolLabel}</span>
                  </div>
                  {summary ? (
                    <div className="text-sm mt-2 text-[var(--cs-muted)] leading-relaxed">{summary}</div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={cx("cs-btn cs-btn-ghost text-sm", wowConfirmed && "opacity-70")}
                  onClick={() => setShowWow(true)}
                >
                  {wowConfirmed ? "Confirmed" : "Confirm"}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="cs-card p-6 space-y-5">
            <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-4">
              <div className="text-sm font-semibold">What happens next</div>
              <ul className="mt-2 space-y-1 text-sm text-[var(--cs-muted)]">
                <li>• I’ll contact you using your preferred method.</li>
                <li>• This is a general information follow-up (not advice).</li>
                <li>• No product comparisons, no pressure.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold">Your name</div>
              <input
                className="cs-input"
                placeholder="e.g. Darren Lim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                maxLength={60}
              />
              {nameError ? <div className="text-xs text-[var(--cs-risk)]">{nameError}</div> : null}
              {!nameError ? (
                <div className="text-xs text-[var(--cs-muted)]">Just so I know how to address you.</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold">Mobile number (Singapore)</div>
              <input
                className="cs-input"
                inputMode="tel"
                placeholder="e.g. 9123 4567"
                value={mobile}
                onChange={(e) => setMobile(formatSGMobilePretty(e.target.value))}
                onBlur={() => setTouched((p) => ({ ...p, mobile: true }))}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-[var(--cs-muted)]">Accepted: 91234567, 9123 4567, +65 91234567</div>
                <div className="text-xs">
                  {mobile.length === 0 ? null : mobileInfo.isValid ? (
                    <span className="text-[var(--cs-good)] font-semibold">Valid ✅</span>
                  ) : (
                    <span className="text-[var(--cs-risk)] font-semibold">Check number</span>
                  )}
                </div>
              </div>
              {mobileError ? <div className="text-xs text-[var(--cs-risk)]">{mobileError}</div> : null}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold">Preferred contact</div>
              <select className="cs-input" value={preferred} onChange={(e) => setPreferred(e.target.value as Preferred)}>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Call">Call</option>
                <option value="Telegram">Telegram</option>
              </select>
              <div className="text-xs text-[var(--cs-muted)]">WhatsApp is usually fastest for quick follow-ups.</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold">Optional message</div>
              <textarea
                className="cs-input"
                rows={4}
                placeholder="What would you like help with? (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              />
              <div className="text-xs text-[var(--cs-muted)] flex items-center justify-between">
                <span>Share the key point — we’ll sort the details together.</span>
                <span>{message.trim().length}/500</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  onBlur={() => setTouched((p) => ({ ...p, consent: true }))}
                />
                <span className="text-[var(--cs-muted)] leading-relaxed">
                  I consent to the collection and use of my personal data for Nigel’s Clarity Space to contact me about this
                  request.
                  <button
                    type="button"
                    className="ml-2 underline text-[var(--cs-text)]"
                    onClick={() => setShowConsentDetails((v) => !v)}
                  >
                    {showConsentDetails ? "Hide details" : "View details"}
                  </button>
                </span>
              </label>

              {consentError ? <div className="mt-2 text-xs text-[var(--cs-risk)]">{consentError}</div> : null}

              {showConsentDetails ? (
                <div className="mt-3 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-3 text-sm text-[var(--cs-muted)] leading-relaxed">
                  <div className="font-semibold text-[var(--cs-text)]">What this consent covers</div>
                  <ul className="mt-2 space-y-1">
                    <li>• Responding to your enquiry and arranging a follow-up conversation.</li>
                    <li>• Contacting you via your chosen method (WhatsApp / Call / Telegram).</li>
                    <li>• Keeping a record of your request to avoid repeating questions.</li>
                  </ul>
                  <div className="mt-2">You can withdraw consent anytime by letting me know.</div>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              className="cs-btn cs-btn-primary w-full"
              disabled={!canSubmit}
              onClick={() => {
                const invalid = firstInvalidField({
                  name,
                  mobileValid: mobileInfo.isValid,
                  consent,
                  hasContext,
                  wowConfirmed,
                });

                if (!invalid) return;

                setTouched({ name: true, mobile: true, consent: true });

                if (invalid === "wow") {
                  setShowWow(true);
                  pushBanner("warn", "Quick confirm: please confirm the tool summary before sending.");
                } else if (invalid === "name") {
                  pushBanner("warn", "Please enter your name (min 5 characters).");
                } else if (invalid === "mobile") {
                  pushBanner("warn", "Please enter a valid Singapore mobile number.");
                } else if (invalid === "consent") {
                  pushBanner("warn", "Consent is required so I can reach you about this request.");
                }
              }}
            >
              {sending ? "Sending..." : "Send request"}
            </button>

            <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
              General information only. This form requests a follow-up conversation and does not constitute financial advice or a product recommendation.
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="cs-card p-7 rounded-[30px]">
            <div className="text-sm font-semibold">Direct contact</div>
            <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">Prefer to reach out directly? Here you go.</div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--cs-muted)]">Phone</span>
                <a className="font-semibold hover:underline" href="tel:+6598627722">
                  9862 7722
                </a>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--cs-muted)]">Email</span>
                <a className="font-semibold hover:underline" href="mailto:nigelchuajm@pruadviser.com.sg">
                  nigelchuajm@pruadviser.com.sg
                </a>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--cs-muted)]">Instagram</span>
                <a className="font-semibold hover:underline" href="https://instagram.com/nigel.cjm" target="_blank" rel="noreferrer">
                  @nigel.cjm
                </a>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <a className="cs-btn cs-btn-primary w-full" href="https://wa.me/6598627722" target="_blank" rel="noreferrer">
                WhatsApp me
              </a>
              <button type="button" className="cs-btn cs-btn-ghost w-full" onClick={() => setShowDisclaimer(true)}>
                Read disclaimer
              </button>
            </div>

            <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
              Disclaimer for Financial Consultants (Affiliated with PACS):{" "}
              <a className="hover:underline" href="https://www.prudential.com.sg/FC-info" target="_blank" rel="noreferrer">
                prudential.com.sg/FC-info
              </a>
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-7">
            <div className="text-sm font-semibold">Comfort promise</div>
            <div className="mt-2 text-sm text-[var(--cs-muted)] leading-relaxed">
              You’re always allowed to say <span className="font-semibold text-[var(--cs-text)]">“Not now.”</span>
              <br />
              No chasing, no guilt. If you want to pause, we pause.
              <br />
              If you want to continue later, we pick up smoothly.
            </div>
          </div>
        </aside>
      </div>

      {showDisclaimer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDisclaimer(false)} />
          <div className="relative w-full max-w-2xl cs-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-[var(--cs-muted)]">Important</div>
                <div className="text-2xl font-bold">Disclaimer</div>
                <div className="text-sm text-[var(--cs-muted)]">Compacted summary (so you don’t lose your form).</div>
              </div>
              <button className="cs-btn cs-btn-ghost" type="button" onClick={() => setShowDisclaimer(false)}>
                Close
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-4 text-sm text-[var(--cs-muted)] leading-relaxed">
              <div className="font-semibold text-[var(--cs-text)]">General information only</div>
              <ul className="mt-2 space-y-1">
                <li>• The content and tools here are for educational purposes and simplified estimates.</li>
                <li>• This is not financial advice, and not a product recommendation.</li>
                <li>• Any follow-up chat is to help you understand your situation and options at a high level.</li>
              </ul>

              <div className="mt-4 font-semibold text-[var(--cs-text)]">Links</div>
              <div className="mt-2 flex flex-col gap-2">
                <a className="cs-btn cs-btn-ghost w-full" href="https://www.prudential.com.sg/FC-info" target="_blank" rel="noreferrer">
                  Prudential FC info
                </a>
                <Link className="cs-btn cs-btn-ghost w-full" href="/disclaimer">
                  Full disclaimer page
                </Link>
              </div>
            </div>

            <div className="mt-4 text-xs text-[var(--cs-muted)]">
              Tip: Press <span className="font-semibold text-[var(--cs-text)]">Esc</span> to close.
            </div>
          </div>
        </div>
      ) : null}

      {showWow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowWow(false)} />
          <div className="relative w-full max-w-lg cs-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-[var(--cs-muted)]">Quick confirm</div>
                <div className="text-2xl font-bold">Confirm your summary</div>
                <div className="text-sm text-[var(--cs-muted)]">I’ll use this context when I reach out.</div>
              </div>
              <button className="cs-btn cs-btn-ghost" type="button" onClick={() => setShowWow(false)}>
                Close
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-4">
              <div className="text-sm font-semibold">Tool</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">{toolLabel}</div>

              <div className="text-sm font-semibold mt-4">Summary</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">
                {summary ? summary : "Direct request (no tool summary attached)."}
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="cs-btn cs-btn-primary w-full"
                onClick={() => {
                  setWowConfirmed(true);
                  setShowWow(false);
                  pushBanner("info", "Confirmed. You can send your request anytime.");
                }}
              >
                Confirm & continue
              </button>
              <button
                type="button"
                className="cs-btn cs-btn-ghost w-full"
                onClick={() => {
                  setWowConfirmed(false);
                  setShowWow(false);
                  pushBanner("info", "No worries — you can still edit before sending.");
                }}
              >
                Edit later
              </button>
            </div>

            <div className="mt-4 text-xs text-[var(--cs-muted)]">
              General info only. Not advice. No product recommendations.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

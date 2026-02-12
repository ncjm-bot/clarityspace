"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  const [touched, setTouched] = useState<{ name: boolean; mobile: boolean; consent: boolean }>({
    name: false,
    mobile: false,
    consent: false,
  });

  const mobileInfo = useMemo(() => normalizeSGMobile(mobile), [mobile]);

  const hasContext = useMemo(() => {
    return Boolean((tool && tool.trim()) || (summary && summary.trim()));
  }, [tool, summary]);

  const toolLabel = useMemo(() => niceToolLabel(tool || "general"), [tool]);

  useEffect(() => {
    if (hasContext) setShowWow(true);
  }, [hasContext]);

  const nameError = useMemo(() => {
    if (!touched.name) return "";
    if (name.trim().length < 2) return "Please enter your name (at least 2 characters).";
    return "";
  }, [name, touched.name]);

  const mobileError = useMemo(() => {
    if (!touched.mobile) return "";
    if (!mobileInfo.isValid) return "Enter an SG mobile (8 digits, starts with 8 or 9).";
    return "";
  }, [mobileInfo.isValid, touched.mobile]);

  const consentError = useMemo(() => {
    if (!touched.consent) return "";
    if (!consent) return "Please tick consent so I can contact you.";
    return "";
  }, [consent, touched.consent]);

  const canSubmit = useMemo(() => {
    const okName = name.trim().length >= 2;
    const okMobile = mobileInfo.isValid;
    const okConsent = consent;
    const okContext = !hasContext || wowConfirmed;
    return okName && okMobile && okConsent && okContext && !sending;
  }, [name, mobileInfo.isValid, consent, hasContext, wowConfirmed, sending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ name: true, mobile: true, consent: true });

    if (hasContext && !wowConfirmed) {
      setShowWow(true);
      return;
    }

    if (name.trim().length < 2) return;
    if (!mobileInfo.isValid) return;
    if (!consent) return;

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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Request a chat</h1>
        <p className="text-[var(--cs-muted)]">
          Leave your details and I’ll reach out. General information follow-up only.
        </p>
      </div>

      {hasContext && (
        <div className="cs-card p-4">
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
              className={`cs-btn cs-btn-ghost text-sm ${wowConfirmed ? "opacity-70" : ""}`}
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
            placeholder="e.g. Alex Tan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            maxLength={60}
          />
          {nameError ? <div className="text-xs text-[var(--cs-risk)]">{nameError}</div> : null}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">Mobile number (Singapore)</div>
          <input
            className="cs-input"
            inputMode="tel"
            placeholder="e.g. 9862 7722"
            value={mobile}
            onChange={(e) => setMobile(formatSGMobilePretty(e.target.value))}
            onBlur={() => setTouched((p) => ({ ...p, mobile: true }))}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-[var(--cs-muted)]">
              Accepted: 98627722, 9862 7722, +65 98627722
            </div>
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
          <select
            className="cs-input"
            value={preferred}
            onChange={(e) => setPreferred(e.target.value as Preferred)}
          >
            <option value="WhatsApp">WhatsApp</option>
            <option value="Call">Call</option>
            <option value="Telegram">Telegram</option>
          </select>
          <div className="text-xs text-[var(--cs-muted)]">
            Tip: WhatsApp is usually fastest for quick follow-ups.
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">Optional message</div>
          <textarea
            className="cs-input"
            rows={4}
            placeholder="Anything you want me to know? (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <div className="text-xs text-[var(--cs-muted)] flex items-center justify-between">
            <span>Keep it short — I’ll ask follow-up questions if needed.</span>
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
              I consent to the collection and use of my personal data for Nigel’s Clarity Space to contact me about
              this request.
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
              <div className="mt-2">
                You can withdraw consent anytime by letting me know.
              </div>
            </div>
          ) : null}
        </div>

        <button type="submit" className="cs-btn cs-btn-primary w-full" disabled={!canSubmit}>
          {sending ? "Sending..." : "Send request"}
        </button>

        <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
          General information only. This form requests a follow-up conversation and does not constitute financial
          advice or a product recommendation.
        </div>
      </form>

      {showWow && (
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
      )}
    </div>
  );
}

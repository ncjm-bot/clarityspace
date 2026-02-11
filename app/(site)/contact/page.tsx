"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Preferred = "WhatsApp" | "Call" | "Telegram";

function normalizeSGMobile(input: string) {
  const digitsOnly = (input || "").replace(/\D/g, "");
  const stripped = digitsOnly.startsWith("65") ? digitsOnly.slice(2) : digitsOnly;
  const isValid = stripped.length === 8 && (stripped.startsWith("8") || stripped.startsWith("9"));
  return { sg8: stripped, isValid };
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
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [showWow, setShowWow] = useState(false);
  const [wowConfirmed, setWowConfirmed] = useState(false);

  const mobileInfo = useMemo(() => normalizeSGMobile(mobile), [mobile]);

  const hasContext = useMemo(() => {
    return Boolean((tool && tool.trim()) || (summary && summary.trim()));
  }, [tool, summary]);

  const toolLabel = useMemo(() => niceToolLabel(tool || "general"), [tool]);

  useEffect(() => {
    if (hasContext) setShowWow(true);
  }, [hasContext]);

  const canSubmit = useMemo(() => {
    const okName = name.trim().length >= 2;
    const okMobile = mobileInfo.isValid;
    return okName && okMobile && consent && !sending && (!hasContext || wowConfirmed);
  }, [name, mobileInfo.isValid, consent, sending, hasContext, wowConfirmed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (hasContext && !wowConfirmed) {
      setErrorText("Please confirm your summary first.");
      setShowWow(true);
      return;
    }

    if (!consent) {
      setErrorText("Please tick consent so I can contact you.");
      return;
    }

    if (name.trim().length < 2) {
      setErrorText("Please enter your name.");
      return;
    }

    if (!mobileInfo.isValid) {
      setErrorText("Please enter a valid Singapore mobile number (8 digits, starts with 8 or 9).");
      return;
    }

    const endpoint = process.env.NEXT_PUBLIC_LEADS_ENDPOINT;
    if (!endpoint) {
      setErrorText("Missing NEXT_PUBLIC_LEADS_ENDPOINT. Your form has nowhere to send to yet.");
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
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setErrorText(`Couldn’t send. ${t ? t.slice(0, 160) : "Please try again."}`);
        return;
      }

      setSent(true);
    } catch {
      setErrorText("Something went wrong sending your request. Please try again.");
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
            Thanks — I’ll reach out via <span className="font-semibold text-[var(--cs-text)]">{preferred}</span>.
          </div>
          <div className="pt-4">
            <a className="cs-btn cs-btn-ghost" href="/tools">
              Back to tools
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Request a chat</h1>
        <p className="text-[var(--cs-muted)]">Leave your details and I’ll reach out. General information follow-up only.</p>
      </div>

      {hasContext && (
        <div className="cs-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Your result summary</div>
              <div className="text-sm text-[var(--cs-muted)] mt-1">
                Tool: <span className="font-medium text-[var(--cs-text)]">{toolLabel}</span>
              </div>
              {summary ? <div className="text-sm mt-1">{summary}</div> : null}
            </div>

            <button
              type="button"
              className={`cs-btn cs-btn-ghost ${wowConfirmed ? "opacity-70" : ""}`}
              onClick={() => setShowWow(true)}
            >
              {wowConfirmed ? "Confirmed" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {errorText ? (
        <div className="cs-card p-4">
          <div className="text-sm font-semibold">Fix needed</div>
          <div className="text-sm text-[var(--cs-muted)] mt-1">{errorText}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="cs-card p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Your name</div>
          <input
            required
            className="cs-input"
            placeholder="e.g. Alex Tan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">Mobile number (Singapore)</div>
          <input
            required
            className="cs-input"
            inputMode="tel"
            placeholder="e.g. 98627722"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <div className="text-xs text-[var(--cs-muted)]">Accepted: 98627722, 9 8627 722, +65 98627722</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">Preferred contact</div>
          <select className="cs-input" value={preferred} onChange={(e) => setPreferred(e.target.value as Preferred)}>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Call">Call</option>
            <option value="Telegram">Telegram</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">Optional message</div>
          <textarea
            className="cs-input"
            rows={4}
            placeholder="Anything you want me to know?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-[var(--cs-muted)]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I consent to being contacted regarding my request.</span>
        </label>

        <button type="submit" className="cs-btn cs-btn-primary w-full" disabled={!canSubmit}>
          {sending ? "Sending..." : "Send request"}
        </button>

        <div className="text-xs text-[var(--cs-muted)] leading-relaxed">
          General information only. This form requests a follow-up conversation and does not constitute financial advice or a product recommendation.
        </div>
      </form>

      {showWow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowWow(false)}
          />
          <div className="relative w-full max-w-lg cs-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-[var(--cs-muted)]">Quick confirm</div>
                <div className="text-2xl font-bold">Confirm your summary ✨</div>
                <div className="text-sm text-[var(--cs-muted)]">
                  I’ll use this context when I reach out.
                </div>
              </div>
              <button className="cs-btn cs-btn-ghost" type="button" onClick={() => setShowWow(false)}>
                Close
              </button>
            </div>

            <div className="mt-4 cs-card p-4">
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

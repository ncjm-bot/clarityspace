"use client";

import React, { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = useMemo<NavItem[]>(
    () => [
      { href: "/story", label: "Story" },
      { href: "/achievements", label: "Achievements" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/insights", label: "Insights" },
      { href: "/tools", label: "Tools" },
      { href: "/contact", label: "Contact" },
    ],
    []
  );

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40">
        <div className="border-b border-[var(--cs-border)] bg-[color:var(--cs-bg)/0.82] backdrop-blur">
          <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-4">
            <div className="mx-auto w-full max-w-[1680px] flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-3 min-w-0">
                <div className="relative cs-glow rounded-2xl">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[rgba(0,184,148,0.35)] to-[rgba(108,92,231,0.35)] blur" />
                  <img
                    src="/clarity-logo.png"
                    alt="Nigel"
                    className="relative h-10 w-10 rounded-2xl border border-[var(--cs-border)] bg-white object-contain"
                  />
                </div>

                <div className="leading-tight min-w-0">
                  <div className="font-semibold tracking-tight truncate">Nigel</div>
                  <div className="text-xs text-[var(--cs-muted)] truncate">Financial Consultant • #GRWN</div>
                </div>
              </a>

              <nav className="hidden lg:flex items-center gap-7">
                {nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cx("cs-navlink", active && "cs-navlink-active")}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>

              <div className="hidden lg:flex items-center gap-2">
                <a
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--cs-border)] bg-white/70 hover:bg-white transition"
                  href="/disclaimer"
                >
                  Disclaimer
                </a>
                <a
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-transparent text-white bg-[color:var(--cs-text)] hover:opacity-90 transition"
                  href="/contact"
                >
                  Request chat
                </a>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <a
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--cs-border)] bg-white/70"
                  href="/contact"
                >
                  Chat
                </a>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--cs-border)] bg-white/70 hover:bg-white transition"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Open menu"
                >
                  {open ? "Close" : "Menu"}
                </button>
              </div>
            </div>

            {open ? (
              <div className="mx-auto w-full max-w-[1680px] mt-4 lg:hidden">
                <div className="rounded-[22px] border border-[var(--cs-border)] bg-white/90 overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                  <div className="p-2">
                    {nav.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className={cx(
                            "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition",
                            active ? "bg-[var(--cs-card)]" : "hover:bg-[var(--cs-card)]"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <span>{item.label}</span>
                          <span className="opacity-60">→</span>
                        </a>
                      );
                    })}
                  </div>

                  <div className="p-3 border-t border-[var(--cs-border)] flex items-center gap-2">
                    <a
                      className="px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--cs-border)] bg-white hover:bg-[var(--cs-card)] transition"
                      href="/disclaimer"
                      onClick={() => setOpen(false)}
                    >
                      Disclaimer
                    </a>
                    <a
                      className="px-3 py-2 rounded-xl text-sm font-semibold border border-transparent text-white bg-[color:var(--cs-text)] hover:opacity-90 transition"
                      href="/contact"
                      onClick={() => setOpen(false)}
                    >
                      Request chat
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-10">
        <div className="mx-auto w-full max-w-[1680px]">{children}</div>
      </main>

      <footer className="border-t border-[var(--cs-border)]">
        <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-10">
          <div className="mx-auto w-full max-w-[1680px] grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="cs-card p-6 rounded-[26px]">
              <div className="text-sm font-semibold">Nigel’s Clarity Space</div>
              <div className="text-sm text-[var(--cs-muted)] mt-2 leading-relaxed">
                General information only. Not financial advice and not a product recommendation. Tools provide estimates and simplified scenarios.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="cs-btn cs-btn-ghost" href="/disclaimer">
                  Disclaimer
                </a>
                <a className="cs-btn cs-btn-ghost" href="/tools">
                  Tools
                </a>
                <a className="cs-btn cs-btn-primary" href="/contact">
                  Request a chat
                </a>
              </div>
            </div>

            <div className="cs-card p-6 rounded-[26px]">
              <div className="text-sm font-semibold">Contact</div>
              <div className="mt-3 space-y-2 text-sm">
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
                  <a
                    className="font-semibold hover:underline"
                    href="https://instagram.com/nigel.cjm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    @nigel.cjm
                  </a>
                </div>
              </div>

              <div className="mt-4 text-xs text-[var(--cs-muted)] leading-relaxed">
                Disclaimer for Financial Consultants (Affiliated with PACS):{" "}
                <a
                  className="hover:underline"
                  href="https://www.prudential.com.sg/FC-info"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://www.prudential.com.sg/FC-info
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

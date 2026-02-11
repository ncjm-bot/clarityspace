import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nigel’s Clarity Space — Self-Check Tools",
  description:
    "Educational self-check tools to explore financial resilience and protection readiness. General information only, not financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--cs-bg)] text-[var(--cs-text)]`}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 bg-[color:var(--cs-bg)/0.92] backdrop-blur border-b border-[var(--cs-border)]">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <img
                  src="/clarity-logo.png"
                  alt="Nigel’s Clarity Space"
                  className="h-9 w-9 rounded-lg border border-[var(--cs-border)] bg-white object-contain"
                />
                <div className="leading-tight">
                  <div className="font-semibold tracking-tight">Nigel’s Clarity Space</div>
                  <div className="text-xs text-[var(--cs-muted)]">#GRWN • Educational self-check tools</div>
                </div>
              </a>

              <nav className="flex items-center gap-2">
                <a
                  href="/tools"
                  className="px-3 py-2 rounded-lg text-sm border border-[var(--cs-border)] bg-white hover:bg-[var(--cs-card)] transition"
                >
                  Tools
                </a>
                <a
                  href="/privacy"
                  className="px-3 py-2 rounded-lg text-sm border border-[var(--cs-border)] bg-white hover:bg-[var(--cs-card)] transition"
                >
                  Disclaimer
                </a>
              </nav>
            </div>
          </header>

          <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>

          <footer className="border-t border-[var(--cs-border)]">
            <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-[var(--cs-muted)] leading-relaxed">
              General information only. Not financial advice and not a product recommendation. For a personalised review,
              request a chat and we’ll follow up.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

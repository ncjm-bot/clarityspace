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
            <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-4">
              <div className="mx-auto w-full max-w-[1680px] flex items-center justify-between gap-4">
                <a href="/" className="flex items-center gap-3 min-w-0">
                  <img
                    src="/clarity-logo.png"
                    alt="Nigel’s Clarity Space"
                    className="h-9 w-9 rounded-lg border border-[var(--cs-border)] bg-white object-contain"
                  />
                  <div className="leading-tight min-w-0">
                    <div className="font-semibold tracking-tight truncate">
                      Nigel’s Clarity Space
                    </div>
                    <div className="text-xs text-[var(--cs-muted)] truncate">
                      #GRWN • Educational self-check tools
                    </div>
                  </div>
                </a>

                <nav className="flex items-center gap-2 shrink-0">
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
            </div>
          </header>

          <main className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-10">
            <div className="mx-auto w-full max-w-[1680px]">{children}</div>
          </main>

          <footer className="border-t border-[var(--cs-border)]">
            <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-8">
              <div className="mx-auto w-full max-w-[1680px] text-xs text-[var(--cs-muted)] leading-relaxed">
                General information only. Not financial advice and not a product
                recommendation. For a personalised review, request a chat and
                we’ll follow up.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

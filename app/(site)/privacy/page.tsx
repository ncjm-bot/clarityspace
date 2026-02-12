import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer — Nigel’s Clarity Space",
  description:
    "General information only. Not financial advice and not a product recommendation. Read the website disclaimer for Nigel’s Clarity Space (#GRWN).",
};

const UPDATED = "12 Feb 2026";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const sections: Section[] = [
  {
    id: "general",
    title: "1. General information only",
    body: (
      <>
        <p>
          The information and self-check tools on this website are provided for general educational
          purposes only. They are designed to help users better understand financial concepts and
          identify potential areas for further review.
        </p>
        <p className="mt-4">
          Nothing on this website constitutes financial advice, investment advice, insurance advice,
          tax advice, or a recommendation to buy, replace, surrender, or cancel any financial product.
        </p>
        <p className="mt-4">
          The content does not take into account your specific financial situation, objectives, needs,
          or risk profile.
        </p>
      </>
    ),
  },
  {
    id: "relationship",
    title: "2. No advisory relationship",
    body: (
      <>
        <p>
          Your use of this website does not create a financial advisory, client, or consultant
          relationship.
        </p>
        <p className="mt-4">
          Any consultation (if requested) will only be conducted after proper fact-finding and in
          accordance with applicable laws and regulatory requirements in Singapore.
        </p>
      </>
    ),
  },
  {
    id: "status",
    title: "3. Representative status",
    body: (
      <>
        <p>
          Nigel Chua is a registered representative of Prudential Assurance Company Singapore (Pte)
          Ltd.
        </p>
        <p className="mt-4">
          Where financial advisory services are provided, they are provided in his capacity as a
          representative of Prudential Assurance Company Singapore (Pte) Ltd, and not in a personal
          capacity.
        </p>
        <p className="mt-4">
          Content on this website is shared for educational purposes and does not represent official
          statements of Prudential unless expressly stated.
        </p>
      </>
    ),
  },
  {
    id: "comparisons",
    title: "4. No product comparisons or guarantees",
    body: (
      <>
        <p>
          This website does not provide product comparisons or endorsements of third-party financial
          products.
        </p>
        <p className="mt-4">
          Any examples, scenarios, or illustrations shown are hypothetical and for explanation only.
          They do not guarantee future performance, returns, or outcomes.
        </p>
        <p className="mt-4">All financial products carry risks. Policy terms and conditions apply.</p>
      </>
    ),
  },
  {
    id: "accuracy",
    title: "5. Accuracy of information",
    body: (
      <>
        <p>
          Reasonable care is taken to keep information accurate and up to date at the time of
          publication. However, no warranty is given as to completeness, reliability, or accuracy.
        </p>
        <p className="mt-4">Information may be updated, modified, or removed without prior notice.</p>
      </>
    ),
  },
  {
    id: "thirdparty",
    title: "6. Third-party links and platforms",
    body: (
      <>
        <p>
          If this website links to third-party websites or tools, you acknowledge that those services
          operate independently and may have their own terms and privacy policies.
        </p>
        <p className="mt-4">
          Nigel’s Clarity Space is not responsible for the content, security, or data practices of
          third-party services.
        </p>
      </>
    ),
  },
  {
    id: "pdpa",
    title: "7. Personal data and PDPA",
    body: (
      <>
        <p>
          Any personal data submitted through this website will be collected, used, and disclosed in
          accordance with Singapore’s Personal Data Protection Act (PDPA).
        </p>
        <p className="mt-4">
          By submitting your information, you consent to being contacted for the purpose of responding
          to your enquiry, arranging a review, or sharing relevant information relating to financial
          planning services.
        </p>
        <p className="mt-4">You may withdraw your consent at any time by contacting us.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "8. Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted under Singapore law, Nigel’s Clarity Space shall not be
          liable for any direct, indirect, incidental, consequential, or special loss or damage arising
          from reliance on information on this website.
        </p>
        <p className="mt-4">
          You should seek personalised professional advice before making financial decisions.
        </p>
      </>
    ),
  },
];

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Disclaimer</h1>
          <p className="mt-1 text-sm text-[var(--cs-muted)]">Nigel’s Clarity Space (#GRWN)</p>
          <p className="mt-2 text-sm text-[var(--cs-muted)]">
            Last updated: <span className="font-semibold text-[var(--cs-text)]">{UPDATED}</span>
            <span className="mx-2 text-[var(--cs-border)]">•</span>
            General information only. Not financial advice and not a product recommendation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tools" className="cs-btn cs-btn-ghost text-sm">
            Back to tools
          </Link>
          <Link href="/contact" className="cs-btn cs-btn-primary text-sm">
            Request a chat
          </Link>
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--cs-border)] bg-white shadow-[0_6px_28px_rgba(15,43,31,0.08)]">
        <div className="border-b border-[var(--cs-border)] bg-[var(--cs-card)]/70 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="cs-badge cs-badge-good">Educational</span>
            <span className="cs-badge">No product names</span>
            <span className="cs-badge">No comparisons</span>
            <span className="cs-badge">Plain English</span>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block border-r border-[var(--cs-border)] px-6 py-6">
            <div className="sticky top-28">
              <div className="text-xs font-semibold tracking-wide text-[var(--cs-muted)]">
                On this page
              </div>
              <nav className="mt-3 space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-lg px-2 py-2 text-sm text-[var(--cs-muted)] hover:bg-[var(--cs-card)] hover:text-[var(--cs-text)] transition"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="text-sm font-semibold">Need help?</div>
                <p className="mt-2 text-sm leading-6 text-[var(--cs-muted)]">
                  Want a personalised review? Request a chat and we’ll follow up.
                </p>
                <div className="mt-3">
                  <Link href="/contact" className="cs-btn cs-btn-primary text-sm w-full">
                    Go to contact
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <article className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="text-[15px] leading-7 text-[var(--cs-muted)]">
              <p>
                Please read this disclaimer carefully. By accessing or using this website, you agree
                to the terms below.
              </p>
            </div>

            <div className="mt-8 space-y-10">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--cs-text)]">
                    {s.title}
                  </h2>
                  <div className="mt-3 text-[15px] leading-7 text-[var(--cs-muted)]">{s.body}</div>
                  <div className="mt-8 h-px w-full bg-[var(--cs-border)]" />
                </section>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-card)]/70 p-5">
              <div className="text-sm font-semibold">Contact</div>
              <p className="mt-2 text-[15px] leading-7 text-[var(--cs-muted)]">
                If you have questions about this disclaimer, you may contact us via the contact page.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                <Link href="/contact" className="cs-btn cs-btn-primary text-sm">
                  Go to contact
                </Link>
                <Link href="/tools" className="cs-btn cs-btn-ghost text-sm">
                  Browse tools
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

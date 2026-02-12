// app/contact/page.tsx
import React, { Suspense } from "react";
import ContactClient from "./ContactClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="cs-card p-6">Loading…</div>}>
      <ContactClient />
    </Suspense>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";
import { TERMS_SECTIONS } from "@/lib/legal-content";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Medora" }] }),
  component: function LegalTermsPage() {
    return (
      <LegalShell title="Terms of Service">
        {TERMS_SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold text-[#1B3B2E]">{s.title}</h2>
            <p className="mt-2 whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </LegalShell>
    );
  },
});

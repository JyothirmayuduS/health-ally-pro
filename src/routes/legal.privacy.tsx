import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Medora" }] }),
  component: function LegalPrivacyPage() {
    return (
      <LegalShell title="Privacy Policy">
        {PRIVACY_SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold text-[#1B3B2E]">{s.title}</h2>
            <p className="mt-2 whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </LegalShell>
    );
  },
});

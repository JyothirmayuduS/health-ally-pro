import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";
import { MEDICAL_DISCLAIMER } from "@/lib/legal-content";

export const Route = createFileRoute("/legal/disclaimer")({
  head: () => ({ meta: [{ title: "Medical Disclaimer — Medora" }] }),
  component: function LegalDisclaimerPage() {
    return (
      <LegalShell title="Medical Disclaimer">
        <p className="whitespace-pre-line">{MEDICAL_DISCLAIMER}</p>
        <p className="mt-6 rounded-2xl border border-[#F0DDD6] bg-[#FDF8F6] p-4 text-[#6B4A3A]">
          Specialty desks, AI prescription assistants, and 3D anatomy maps are training /
          documentation aids — not autonomous medical devices.
        </p>
      </LegalShell>
    );
  },
});

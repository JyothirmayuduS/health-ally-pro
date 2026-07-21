import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";

export const Route = createFileRoute("/profile/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Medora" }] }),
  component: function ProfilePrivacyPage() {
    return (
      <ProfileSubpageLayout
        title="Privacy"
        subtitle="How Medora protects your records."
      >
        <div className="space-y-4 rounded-[24px] border border-[#EDEAE6] bg-white p-5 text-sm leading-relaxed text-ink-muted">
          <div className="flex gap-3 text-ink">
            <Shield className="h-5 w-5 shrink-0 text-clay" />
            <p className="font-medium">Encryption, access control, and audit-friendly design</p>
          </div>
          {PRIVACY_SECTIONS.slice(0, 3).map((s) => (
            <section key={s.title}>
              <h3 className="font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 whitespace-pre-line">{s.body}</p>
            </section>
          ))}
          <Link to="/legal/privacy" className="inline-block text-sm font-semibold text-clay">
            Read full Privacy Policy →
          </Link>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

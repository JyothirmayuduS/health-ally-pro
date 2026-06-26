import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";

export const Route = createFileRoute("/profile/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Medora" }] }),
  component: function ProfilePrivacyPage() {
    return (
      <ProfileSubpageLayout
        title="Privacy & blockchain"
        subtitle="How Medora protects and verifies your records."
      >
        <div className="space-y-4 rounded-[24px] border border-[#EDEAE6] bg-white p-5 text-sm leading-relaxed text-ink-muted">
          <div className="flex gap-3 text-ink">
            <Shield className="h-5 w-5 shrink-0 text-clay" />
            <p className="font-medium">End-to-end encryption for shared reports</p>
          </div>
          <p>
            Reports are encrypted at rest with AES-256. When you share with a specialist,
            access is time-limited and revocable from your archive.
          </p>
          <p>
            Blockchain anchoring (demo) verifies audit events — uploads, shares, and
            revocations — without exposing clinical content on-chain.
          </p>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

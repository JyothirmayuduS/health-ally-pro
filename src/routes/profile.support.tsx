import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";

export const Route = createFileRoute("/profile/support")({
  head: () => ({ meta: [{ title: "Support — Medora" }] }),
  component: function ProfileSupportPage() {
    return (
      <ProfileSubpageLayout
        title="Contact support"
        subtitle="Care concierge · 24/7 for urgent issues"
      >
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-6">
          <p className="text-sm text-ink-muted">
            Email{" "}
            <a href="mailto:support@medora.health" className="font-medium text-clay">
              support@medora.health
            </a>
          </p>
          <a
            href="tel:+15550123456"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            <Phone className="h-4 w-4" />
            Call care concierge
          </a>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

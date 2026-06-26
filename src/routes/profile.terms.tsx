import { createFileRoute } from "@tanstack/react-router";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";

export const Route = createFileRoute("/profile/terms")({
  head: () => ({ meta: [{ title: "Terms — Medora" }] }),
  component: function ProfileTermsPage() {
    return (
      <ProfileSubpageLayout title="Terms & Conditions" subtitle="Medora patient agreement">
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-5 text-sm leading-relaxed text-ink-muted">
          <p>
            Medora provides curated care coordination tools. This demo environment uses
            sample data and is not a substitute for emergency medical services.
          </p>
          <p className="mt-4">
            By using the app you agree to secure handling of PHI under applicable privacy
            regulations. Full legal text would appear here in production.
          </p>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

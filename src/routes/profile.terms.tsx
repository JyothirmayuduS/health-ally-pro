import { createFileRoute } from "@tanstack/react-router";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";
import { Link } from "@tanstack/react-router";
import { TERMS_SECTIONS } from "@/lib/legal-content";

export const Route = createFileRoute("/profile/terms")({
  head: () => ({ meta: [{ title: "Terms — Medora" }] }),
  component: function ProfileTermsPage() {
    return (
      <ProfileSubpageLayout title="Terms & Conditions" subtitle="Medora patient agreement">
        <div className="space-y-4 rounded-[24px] border border-[#EDEAE6] bg-white p-5 text-sm leading-relaxed text-ink-muted">
          {TERMS_SECTIONS.slice(0, 4).map((s) => (
            <section key={s.title}>
              <h3 className="font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 whitespace-pre-line">{s.body}</p>
            </section>
          ))}
          <Link to="/legal/terms" className="inline-block text-sm font-semibold text-clay">
            Read full Terms of Service →
          </Link>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

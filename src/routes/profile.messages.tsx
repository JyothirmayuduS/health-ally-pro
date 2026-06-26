import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";

export const Route = createFileRoute("/profile/messages")({
  head: () => ({ meta: [{ title: "Messages — Medora" }] }),
  component: function ProfileMessagesPage() {
    return (
      <ProfileSubpageLayout
        title="Messages"
        subtitle="Secure chat with your care team and concierge."
      >
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-8 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-ink-muted" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-ink">No new messages</p>
          <p className="mt-2 text-sm text-ink-muted">
            When your doctor or care concierge replies, threads appear here.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/profile/support"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              <Phone className="h-4 w-4" strokeWidth={1.75} />
              Contact support
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              Book an appointment
            </Link>
          </div>
        </div>
      </ProfileSubpageLayout>
    );
  },
});

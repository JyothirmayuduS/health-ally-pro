import { Link } from "@tanstack/react-router";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";

const PACK = [
  { to: "/security", label: "Security overview" },
  { to: "/sla", label: "SLA" },
  { to: "/legal/baa", label: "BAA & DPA pack" },
  { to: "/legal/privacy", label: "Privacy policy" },
  { to: "/legal/terms", label: "Terms of service" },
  { to: "/status", label: "System status" },
  { to: "/implement", label: "Implementation checklist" },
  { href: "/legal/subprocessors.md", label: "Subprocessors list" },
];

export default function TrustPackPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader active="security" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Trust pack</h1>
        <p className="mt-3 text-sm text-[#5C6B63]">
          One place for procurement: security, legal templates, SLA, status, and go-live checklist.
        </p>
        <ul className="mt-8 divide-y divide-[#E8E4DE] rounded-2xl border border-[#E8E4DE] bg-white">
          {PACK.map((item) => (
            <li key={item.label}>
              {"to" in item && item.to ? (
                <Link
                  to={item.to}
                  className="flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-[#F7F5F2]"
                >
                  {item.label}
                  <span className="text-[#B8735D]">Open</span>
                </Link>
              ) : (
                <a
                  href={"href" in item ? item.href : "#"}
                  className="flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-[#F7F5F2]"
                >
                  {item.label}
                  <span className="text-[#B8735D]">Download</span>
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-[#8A8F8C]">
          PHI access audit CSV is available to hospital admins under Admin → Audit after go-live.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

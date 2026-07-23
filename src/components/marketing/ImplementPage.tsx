import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { salesMailto } from "@/lib/legal-content";

const STEPS = [
  "Confirm campus size, specialties, and plan (Starter / Professional / Enterprise)",
  "Sign order form + BAA / DPA pack",
  "Receive MEDORA_LICENSE_KEY and production env checklist",
  "Provision Supabase project (or Medora-hosted tenant) and apply migrations",
  "Configure VITE_* + server secrets; disable demo auth",
  "Create hospital admin + invite specialty doctors",
  "UAT on specialty desks, lab, pharmacy, billing with synthetic patients",
  "Cut over DNS / Cloudflare; enable monitoring and support channel",
];

export default function ImplementPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Implementation checklist</h1>
        <p className="mt-3 text-[#5C6B63]">
          For hospital IT leads going from signed quote to first live OPD day.
        </p>
        <ol className="mt-8 space-y-3">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-[#E8E4DE] bg-white px-4 py-3 text-sm"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E8EFE6] text-xs font-bold">
                {i + 1}
              </span>
              <span className="flex-1 pt-0.5">{step}</span>
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C5D0C8]" />
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register-hospital"
            className="rounded-full bg-[#B8735D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A56450]"
          >
            Start onboarding
          </Link>
          <a
            href={salesMailto("Implementation kickoff")}
            className="rounded-full border border-[#1B3B2E]/15 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#F4F1EC]"
          >
            Email kickoff
          </a>
          <Link
            to="/security"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#5C6B63]"
          >
            Security overview
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

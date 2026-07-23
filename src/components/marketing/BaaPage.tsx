import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { LEGAL_CONTACT, LEGAL_ENTITY, salesMailto } from "@/lib/legal-content";

const DOWNLOADS = [
  {
    href: "/legal/baa-template.md",
    label: "BAA template (.md)",
    desc: "HIPAA Business Associate Agreement draft",
  },
  {
    href: "/legal/dpa-template.md",
    label: "DPA template (.md)",
    desc: "Data Processing Agreement draft",
  },
  {
    href: "/legal/subprocessors.md",
    label: "Subprocessors list",
    desc: "Current infrastructure processors",
  },
];

export default function BaaPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">BAA &amp; DPA pack</h1>
        <p className="mt-3 text-sm text-[#5C6B63]">
          Downloadable templates for hospital counsel. Final agreements are countersigned with your
          order form — templates alone are not a signed contract.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {DOWNLOADS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              download
              className="rounded-2xl border border-[#E8E4DE] bg-white p-4 transition hover:border-[#1B3B2E]/30"
            >
              <div className="text-sm font-semibold text-[#1B3B2E]">{d.label}</div>
              <p className="mt-1 text-xs text-[#5C6B63]">{d.desc}</p>
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#3D4F45]">
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Business Associate Agreement (BAA)</h2>
            <p className="mt-2">
              Where {LEGAL_ENTITY} processes protected health information on behalf of a covered
              entity customer, a BAA defines permitted uses, safeguards, breach notification, and
              return/destruction of PHI at termination.
            </p>
          </section>
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Data Processing Agreement (DPA)</h2>
            <p className="mt-2">
              For jurisdictions requiring processor terms: roles, subprocessors (Cloudflare,
              Supabase, optional Stripe/AI under BAA flags), international transfers, and audit
              rights.
            </p>
          </section>
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Countersigned pack</h2>
            <p className="mt-2">
              Email{" "}
              <a
                className="font-semibold text-[#B8735D]"
                href={salesMailto("Request BAA / DPA pack")}
              >
                sales
              </a>{" "}
              or {LEGAL_CONTACT} with your hospital legal name and intended go-live date after
              commercial qualification.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

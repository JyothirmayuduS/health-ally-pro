import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { LEGAL_CONTACT, LEGAL_ENTITY, salesMailto } from "@/lib/legal-content";

export default function BaaPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">BAA &amp; DPA pack</h1>
        <p className="mt-3 text-sm text-[#5C6B63]">
          Template overview for hospital counsel. Final agreements are issued with your order form —
          this page is not a signed contract.
        </p>
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
              For jurisdictions requiring processor terms: roles, subprocessors (e.g. Cloudflare,
              Supabase, optional AI providers under BAA flags), international transfers, and audit
              rights.
            </p>
          </section>
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">How to obtain the pack</h2>
            <p className="mt-2">
              Email{" "}
              <a className="font-semibold text-[#B8735D]" href={salesMailto("Request BAA / DPA pack")}>
                sales
              </a>{" "}
              or {LEGAL_CONTACT} with your hospital legal name and intended go-live date. Packs are
              issued after commercial qualification.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

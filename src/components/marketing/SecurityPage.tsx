import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { SECURITY_CONTACT, salesMailto } from "@/lib/legal-content";

export default function SecurityPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader active="security" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Security</h1>
        <p className="mt-3 text-[#5C6B63]">
          Procurement-ready overview for hospital IT and information security reviewers.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3D4F45]">
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Architecture</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Web app on Cloudflare Workers (TLS in transit)</li>
              <li>Supabase Postgres with Row Level Security (tenant = hospital)</li>
              <li>Staff auth via Supabase JWT; hospital persistence API scopes to membership</li>
              <li>Service role keys remain server-only</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Controls</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Demo staff logins disabled in licensed production builds</li>
              <li>Evaluation watermark on unlicensed product shells (not on marketing pages)</li>
              <li>AI assistants: PHI redaction + BAA flags</li>
              <li>Onboarding rate-limited; tenant provision auth-gated</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Customer responsibilities</h2>
            <p className="mt-3">
              The hospital remains controller of PHI. Complete DPA/BAA before live patient data. Do
              not enable demo auth on production patient systems.
            </p>
          </section>
          <p>
            Report issues:{" "}
            <a className="font-semibold text-[#B8735D]" href={`mailto:${SECURITY_CONTACT}`}>
              {SECURITY_CONTACT}
            </a>
            {" · "}
            <a
              className="font-semibold text-[#B8735D]"
              href={salesMailto("Security questionnaire")}
            >
              Request security pack
            </a>
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

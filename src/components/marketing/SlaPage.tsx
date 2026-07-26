import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { salesMailto } from "@/lib/legal-content";

export default function SlaPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader active="sla" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Service levels</h1>
        <p className="mt-3 text-[#5C6B63]">
          Standard SaaS targets for licensed Professional and Enterprise customers. Enterprise
          contracts may supersede these terms.
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#E8E4DE] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F4F1EC] text-xs uppercase tracking-wide text-[#8A8F8C]">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Professional</th>
                <th className="px-4 py-3">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-[#3D4F45]">
              <tr className="border-t border-[#E8E4DE]">
                <td className="px-4 py-3">Monthly uptime target</td>
                <td className="px-4 py-3">99.5%</td>
                <td className="px-4 py-3">99.9%</td>
              </tr>
              <tr className="border-t border-[#E8E4DE]">
                <td className="px-4 py-3">Support hours</td>
                <td className="px-4 py-3">Business hours IST</td>
                <td className="px-4 py-3">24×7 critical</td>
              </tr>
              <tr className="border-t border-[#E8E4DE]">
                <td className="px-4 py-3">Severity-1 response</td>
                <td className="px-4 py-3">4 hours</td>
                <td className="px-4 py-3">1 hour</td>
              </tr>
              <tr className="border-t border-[#E8E4DE]">
                <td className="px-4 py-3">Scheduled maintenance</td>
                <td className="px-4 py-3" colSpan={2}>
                  Announced ≥48h ahead; prefer off-peak IST windows
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-[#5C6B63]">
          Uptime excludes force majeure, customer network issues, and third-party cloud region
          outages. Credits (if any) are defined in the signed order form.
        </p>
        <a
          href={salesMailto("Medora SLA / order form")}
          className="mt-6 inline-flex rounded-full bg-[#1B3B2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#244C3B]"
        >
          Request order form with SLA
        </a>
      </main>
      <MarketingFooter />
    </div>
  );
}

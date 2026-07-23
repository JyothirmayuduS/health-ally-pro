import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { salesMailto, SALES_CONTACT } from "@/lib/legal-content";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "₹49,000",
    period: "/ month",
    blurb: "Single campus OPD + EMR + lab + pharmacy",
    features: [
      "Up to 25 staff seats",
      "General + 5 specialties",
      "Patient portal",
      "Email support",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "₹1,29,000",
    period: "/ month",
    blurb: "Full multi-specialty + 3D anatomy + IPD/OT units",
    features: [
      "Up to 150 seats",
      "All 30 specialty desks + 3D anatomy",
      "IPD, OT, blood bank, CSSD boards",
      "White-label hospital name",
      "Priority onboarding",
    ],
    cta: "Start hospital",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "Multi-branch, AI CDSS, BAA, dedicated success",
    features: [
      "Unlimited branches*",
      "AI prescription assist (BAA options)",
      "SSO / custom SLA",
      "On-prem or VPC options",
      "Named customer success",
    ],
    cta: "Request proposal",
    highlight: false,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader active="pricing" />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Pricing</h1>
        <p className="mt-2 max-w-xl text-[#5C6B63]">
          Transparent hospital SaaS pricing for India campuses. Quotes finalize on beds, branches,
          and modules — start onboarding or email sales for a formal order form.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[28px] border p-6 ${
                plan.highlight
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-lg"
                  : "border-[#E8E4DE] bg-white"
              }`}
            >
              <h2 className="font-serif text-xl font-semibold">{plan.name}</h2>
              <p className={`mt-1 text-sm ${plan.highlight ? "text-[#B8C5BE]" : "text-[#8A8F8C]"}`}>
                {plan.blurb}
              </p>
              <p className="mt-5 font-serif text-3xl font-semibold">
                {plan.price}
                <span
                  className={`text-base font-sans font-normal ${plan.highlight ? "text-[#B8C5BE]" : "text-[#8A8F8C]"}`}
                >
                  {plan.period}
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check
                      className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-[#B8735D]" : "text-[#1B3B2E]"}`}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-2">
                <Link
                  to="/register-hospital"
                  search={{ plan: plan.id as string }}
                  className={`flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold ${
                    plan.highlight
                      ? "bg-[#B8735D] text-white hover:bg-[#A56450]"
                      : "bg-[#1B3B2E] text-white hover:bg-[#244C3B]"
                  }`}
                >
                  {plan.cta}
                </Link>
                <a
                  href={salesMailto(
                    `Medora ${plan.name} plan inquiry`,
                    `Plan: ${plan.name}\nBeds:\nBranches:\nSpecialties needed:\n`,
                  )}
                  className={`flex w-full items-center justify-center rounded-full border py-2.5 text-xs font-semibold ${
                    plan.highlight
                      ? "border-white/30 text-[#E8EFE6] hover:bg-white/10"
                      : "border-[#E8E4DE] text-[#5C6B63] hover:bg-[#F7F5F2]"
                  }`}
                >
                  Email {SALES_CONTACT}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-xs text-[#8A8F8C]">
          *Enterprise branch limits per contract. Not a binding offer — formal quotation required.
          Licensed customers receive an order form + BAA pack before go-live.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

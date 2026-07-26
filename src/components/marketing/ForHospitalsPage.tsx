import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  Heart,
  Bone,
  Baby,
  Shield,
  Stethoscope,
} from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { salesMailto, SALES_CONTACT } from "@/lib/legal-content";

const PORTALS = [
  "Doctor specialty EMR + 3D anatomy",
  "Reception / OPD queue & IPD beds",
  "Lab, pharmacy, billing desks",
  "Nursing, OT, hospital units",
  "Patient app (web + mobile)",
  "Admin: doctors, roster, analytics",
];

const SPECIALTIES = [
  { icon: Eye, label: "Eye" },
  { icon: Heart, label: "Heart" },
  { icon: Baby, label: "Children" },
  { icon: Bone, label: "Bones" },
  { icon: Stethoscope, label: "30+ specialties" },
];

export default function ForHospitalsPage() {
  return (
    <div className="min-h-dvh bg-[#F4F1EC] text-[#1B3B2E]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% -10%, #D4E8DF 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, #F0DDD6 0%, transparent 50%)",
        }}
      />

      <MarketingHeader active="product" />

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6B5C]">
            Multi-specialty hospital platform
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Medora
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[#5C6B63] sm:text-xl">
            One hospital OS — specialty doctor desks, 3D anatomy, lab, pharmacy, billing, and
            patient engagement — ready to license for your campus.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register-hospital"
              className="inline-flex items-center gap-2 rounded-full bg-[#B8735D] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#A56450]"
            >
              Request hospital workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={salesMailto("Medora product demo request")}
              className="inline-flex items-center gap-2 rounded-full border border-[#1B3B2E]/15 bg-white/70 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white"
            >
              Book a sales call
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-3 text-sm font-semibold text-[#5C6B63] hover:text-[#1B3B2E]"
            >
              View plans
            </Link>
          </div>
        </section>

        <section className="border-y border-[#E4DFD8] bg-white/50">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-6 sm:px-6">
            {SPECIALTIES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-[#F7F5F2] px-4 py-2 text-sm font-medium"
              >
                <Icon className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-semibold sm:text-3xl">What hospitals get</h2>
              <p className="mt-3 text-[#5C6B63]">
                Role-based portals for every desk — not a single generic EMR screen.
              </p>
              <ul className="mt-6 space-y-3">
                {PORTALS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#E8EFE6]">
                      <Check className="h-3 w-3 text-[#1B3B2E]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] border border-[#E4DFD8] bg-white p-6 shadow-[0_8px_40px_rgba(27,59,46,0.06)] sm:p-8">
              <Building2 className="h-8 w-8 text-[#B8735D]" strokeWidth={1.5} />
              <h3 className="mt-4 font-serif text-xl font-semibold">Admin assigns specialty</h3>
              <p className="mt-2 text-sm text-[#5C6B63]">
                Add a cardiologist — they see heart desk + cardiac 3D anatomy. Add an
                ophthalmologist — they see eye charting + orbit focus. Same hospital, specialty-true
                workspaces.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F7F5F2] p-4 text-sm">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#1B3B2E]" />
                <p className="text-[#5C6B63]">
                  Clinical data dual-writes to Supabase with authenticated hospital persistence.
                  Licensed go-live includes order form, BAA, and implementation checklist.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#E4DFD8] bg-[#1B3B2E] px-4 py-14 text-[#F7F5F2] sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Ready to license Medora?</h2>
              <p className="mt-2 text-sm text-[#B8C5BE]">
                <a
                  href={salesMailto("Medora hospital license")}
                  className="underline-offset-2 hover:underline"
                >
                  {SALES_CONTACT}
                </a>{" "}
                · Include campus size and specialty mix
              </p>
            </div>
            <Link
              to="/register-hospital"
              className="inline-flex items-center gap-2 rounded-full bg-[#B8735D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#A56450]"
            >
              Start onboarding
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

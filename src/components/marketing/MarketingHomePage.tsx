import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { salesMailto } from "@/lib/legal-content";

/**
 * Public buyer landing — brand-first, one composition, one CTA group.
 * Patient product lives at /app; staff at /login.
 */
export default function MarketingHomePage() {
  return (
    <div className="min-h-dvh bg-[#F4F1EC] text-[#1B3B2E]">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 10% -20%, #C8DDD2 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, #E8D0C4 0%, transparent 45%), linear-gradient(180deg, transparent 40%, #F4F1EC 100%)",
        }}
      />
      <MarketingHeader active="home" />

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl items-end gap-10 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-20 lg:pt-10">
          <div>
            <p className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
              Medora
            </p>
            <h1 className="mt-5 max-w-lg text-xl font-medium leading-snug text-[#3D4F45] sm:text-2xl">
              Specialty-true hospital software — license it for your campus.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#5C6B63] sm:text-base">
              Assign a doctor’s specialty. They get the matching clinical desk and 3D anatomy —
              not another generic EMR screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register-hospital"
                className="inline-flex items-center gap-2 rounded-full bg-[#B8735D] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#A56450]"
              >
                Start hospital onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={salesMailto("Medora sales — hospital licensing")}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B3B2E]/15 bg-white/80 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white"
              >
                Email sales
              </a>
            </div>
          </div>

          <div
            className="relative min-h-[280px] overflow-hidden rounded-[2px] sm:min-h-[360px]"
            style={{
              background:
                "linear-gradient(145deg, #1B3B2E 0%, #2A5342 45%, #3D6B55 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 70% 30%, #B8735D55 0%, transparent 40%), radial-gradient(circle at 20% 80%, #ffffff22 0%, transparent 35%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="flex gap-3 text-[#E8EFE6]">
                <Stethoscope className="h-6 w-6" strokeWidth={1.5} />
                <Building2 className="h-6 w-6 opacity-70" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8C5BE]">
                  Multi-specialty hospital OS
                </p>
                <p className="mt-2 max-w-xs font-serif text-2xl font-semibold text-white sm:text-3xl">
                  Eye. Heart. Children. Bones. One campus.
                </p>
                <Link
                  to="/for-hospitals"
                  className="mt-5 inline-flex text-sm font-semibold text-[#F0DDD6] underline-offset-4 hover:underline"
                >
                  See the product →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

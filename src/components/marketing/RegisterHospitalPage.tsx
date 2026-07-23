import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ONBOARDING_SPECIALTIES,
  saveHospitalBrand,
  type HospitalBrand,
} from "@/lib/hospital-brand";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import { TurnstileWidget } from "@/components/marketing/TurnstileWidget";
import { salesMailto, SALES_CONTACT } from "@/lib/legal-content";
import { toast } from "sonner";

type PlanId = HospitalBrand["plan"];

export default function RegisterHospitalPage({ initialPlan }: { initialPlan?: string }) {
  const [done, setDone] = useState<HospitalBrand | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstile = useCallback((token: string | null) => setTurnstileToken(token), []);
  const [form, setForm] = useState({
    hospitalName: "",
    legalName: "",
    adminName: "",
    adminEmail: "",
    city: "",
    beds: 100,
    plan: (["starter", "professional", "enterprise"].includes(initialPlan ?? "")
      ? initialPlan
      : "professional") as PlanId,
    specialties: ["General Medicine", "Cardiology", "Pediatrics"] as string[],
    accent: "#1B3B2E",
    accepted: false,
  });

  const toggleSpecialty = (name: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(name)
        ? f.specialties.filter((s) => s !== name)
        : [...f.specialties, name],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accepted) {
      toast.error("Accept Terms & Medical Disclaimer to continue");
      return;
    }
    if (!form.hospitalName.trim() || !form.adminEmail.trim()) {
      toast.error("Hospital name and admin email are required");
      return;
    }
    const needsTurnstile = Boolean(
      (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim(),
    );
    if (needsTurnstile && !turnstileToken) {
      toast.error("Complete bot verification");
      return;
    }
    const brand: HospitalBrand = {
      hospitalName: form.hospitalName.trim(),
      legalName: form.legalName.trim() || form.hospitalName.trim(),
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim().toLowerCase(),
      city: form.city.trim(),
      beds: form.beds,
      plan: form.plan,
      specialties: form.specialties,
      accent: form.accent,
      createdAt: new Date().toISOString(),
    };
    saveHospitalBrand(brand, { syncRemote: false });
    const { syncOnboardingLead } = await import("@/lib/specialties/remote-sync");
    const res = await syncOnboardingLead(brand, { turnstileToken: turnstileToken ?? undefined });
    const ok = res && typeof res === "object" && "ok" in res && (res as { ok?: boolean }).ok;
    toast.success(ok ? "Registration received" : "Saved — we will sync when online");
    setDone(brand);
  };

  if (done) {
    return (
      <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
        <MarketingHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6B5C]">
            Application received
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">{done.hospitalName}</h1>
          <p className="mt-3 text-sm text-[#5C6B63]">
            Our team will send your license key, order form, and BAA pack to{" "}
            <strong>{done.adminEmail}</strong>. Typical response within one business day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={salesMailto(
                `Follow-up: ${done.hospitalName}`,
                `Hospital: ${done.hospitalName}\nPlan: ${done.plan}\nBeds: ${done.beds}\nAdmin: ${done.adminName} <${done.adminEmail}>\nSpecialties: ${done.specialties.join(", ")}\n`,
              )}
              className="rounded-full bg-[#B8735D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#A56450]"
            >
              Email {SALES_CONTACT}
            </a>
            <Link
              to="/implement"
              className="rounded-full border border-[#1B3B2E]/15 bg-white px-6 py-3 text-sm font-semibold hover:bg-[#F4F1EC]"
            >
              Implementation checklist
            </Link>
            <Link to="/pricing" className="rounded-full px-6 py-3 text-sm font-semibold text-[#5C6B63]">
              Back to pricing
            </Link>
          </div>
        </main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-semibold">Register your hospital</h1>
        <p className="mt-2 text-sm text-[#5C6B63]">
          Start a commercial onboarding lead. Sales activates your license key and tenant —
          this is not open self-serve go-live.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-[24px] border border-[#E8E4DE] bg-white p-6">
          <label className="block text-xs font-semibold">
            Hospital display name
            <input
              required
              value={form.hospitalName}
              onChange={(e) => setForm((f) => ({ ...f, hospitalName: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              placeholder="Your Medical Center"
            />
          </label>
          <label className="block text-xs font-semibold">
            Legal entity name
            <input
              value={form.legalName}
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold">
              Admin full name
              <input
                required
                value={form.adminName}
                onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold">
              Admin email
              <input
                required
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold">
              City
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold">
              Approx. beds
              <input
                type="number"
                min={10}
                value={form.beds}
                onChange={(e) => setForm((f) => ({ ...f, beds: Number(e.target.value) }))}
                className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold">
            Plan
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as PlanId }))}
              className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>

          <div>
            <p className="text-xs font-semibold">Launch specialties</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ONBOARDING_SPECIALTIES.map((s) => {
                const on = form.specialties.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      on ? "bg-[#1B3B2E] text-white" : "bg-[#F5F2ED] text-[#5C6B63]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-[#5C6B63]">
            <input
              type="checkbox"
              checked={form.accepted}
              onChange={(e) => setForm((f) => ({ ...f, accepted: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <Link to="/legal/terms" className="font-semibold text-[#B8735D]">
                Terms
              </Link>
              ,{" "}
              <Link to="/legal/privacy" className="font-semibold text-[#B8735D]">
                Privacy Policy
              </Link>
              , and{" "}
              <Link to="/legal/disclaimer" className="font-semibold text-[#B8735D]">
                Medical Disclaimer
              </Link>
              .
            </span>
          </label>

          <TurnstileWidget onToken={onTurnstile} />

          <button
            type="submit"
            className="w-full rounded-full bg-[#B8735D] py-3 text-sm font-semibold text-white hover:bg-[#A56450]"
          >
            Submit hospital registration
          </button>
          <p className="text-center text-[11px] text-[#8A8F8C]">
            Questions?{" "}
            <a href={salesMailto("Medora onboarding question")} className="font-semibold text-[#B8735D]">
              {SALES_CONTACT}
            </a>
          </p>
        </form>
      </main>
      <MarketingFooter />
    </div>
  );
}

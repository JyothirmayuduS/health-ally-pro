import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ONBOARDING_SPECIALTIES,
  saveHospitalBrand,
  type HospitalBrand,
} from "@/lib/hospital-brand";
import { SALES_CONTACT } from "@/lib/legal-content";
import { toast } from "sonner";

type PlanId = HospitalBrand["plan"];

export default function RegisterHospitalPage({ initialPlan }: { initialPlan?: string }) {
  const navigate = useNavigate();
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
    const res = await syncOnboardingLead(brand);
    const ok = res && typeof res === "object" && "ok" in res && (res as { ok?: boolean }).ok;
    toast.success(
      ok
        ? "Registration received — sales will activate your license and tenant"
        : "Saved locally — we will sync when the server is online",
    );
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <header className="border-b border-[#E8E4DE] bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/for-hospitals" className="font-serif text-xl font-semibold">
            Medora
          </Link>
          <span className="text-xs text-[#8A8F8C]">Hospital onboarding</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-semibold">Register your hospital</h1>
        <p className="mt-2 text-sm text-[#5C6B63]">
          Saves a sales lead (rate-limited). Tenant provisioning requires sales/admin
          authorization — not open self-serve hospital create.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-[24px] border border-[#E8E4DE] bg-white p-6">
          <label className="block text-xs font-semibold">
            Hospital display name
            <input
              required
              value={form.hospitalName}
              onChange={(e) => setForm((f) => ({ ...f, hospitalName: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] px-3 py-2.5 text-sm"
              placeholder="Oak Haven Medical Center"
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

          <button
            type="submit"
            className="w-full rounded-full bg-[#B8735D] py-3 text-sm font-semibold text-white hover:bg-[#A56450]"
          >
            Save hospital draft & continue
          </button>
          <p className="text-center text-[11px] text-[#8A8F8C]">
            Questions? {SALES_CONTACT}
          </p>
        </form>
      </main>
    </div>
  );
}

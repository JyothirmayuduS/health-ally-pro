import { useState } from "react";
import { loadHospital } from "@/lib/admin-desk/config";
import { toast } from "sonner";
import { ShieldAlert, Building2, Save, CreditCard, Mail, Barcode, ImagePlus } from "lucide-react";
import { displayHospitalLogo, loadHospitalBrand, updateHospitalLogo } from "@/lib/hospital-brand";
import { getLicenseStatus, getSeatLimits, hasModule } from "@/lib/license";

const SETTINGS_KEY = "medora-admin-settings-v1";

type AdminSettings = {
  requireInsurance: boolean;
  autoInvoiceOnCheckIn: boolean;
  labResultsEmail: boolean;
  pharmacyBarcodeRequired: boolean;
};

const DEFAULT: AdminSettings = {
  requireInsurance: false,
  autoInvoiceOnCheckIn: true,
  labResultsEmail: true,
  pharmacyBarcodeRequired: false,
};

function loadSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as AdminSettings) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function saveSettings(s: AdminSettings) {
  if (typeof window !== "undefined") localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function AdminSettings() {
  const hospital = loadHospital();
  const [settings, setSettings] = useState(loadSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(() => displayHospitalLogo());
  const license = getLicenseStatus();
  const seats = getSeatLimits();
  const canWhiteLabel = hasModule("white_label") || license.evaluation;

  const toggle = (key: keyof AdminSettings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const save = () => {
    setIsSaving(true);
    saveSettings(settings);
    toast.success("Hospital system configuration saved");
    setTimeout(() => setIsSaving(false), 800);
  };

  const onLogoFile = (file: File | null) => {
    if (!file) return;
    if (!canWhiteLabel) {
      toast.error("White-label logo requires Enterprise plan");
      return;
    }
    if (file.size > 400_000) {
      toast.error("Logo must be under 400KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      updateHospitalLogo(dataUrl);
      setLogoPreview(dataUrl);
      toast.success("Hospital logo updated — refresh desks to see it");
    };
    reader.readAsDataURL(file);
  };

  const openBillingPortal = async () => {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loadHospitalBrand()?.adminEmail || hospital.email,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(data.error || "Billing portal unavailable");
    } catch {
      toast.error("Billing portal unavailable");
    }
  };

  const billingSettings = [
    {
      key: "autoInvoiceOnCheckIn" as const,
      label: "Auto-invoice on check-in",
      desc: "Automatically issue a consultation invoice when a patient checks in at reception.",
      icon: CreditCard,
    },
    {
      key: "requireInsurance" as const,
      label: "Require insurance verification",
      desc: "Hard-block billing checkout until policy details are confirmed for insured visits.",
      icon: ShieldAlert,
    },
  ];

  const clinicalSettings = [
    {
      key: "labResultsEmail" as const,
      label: "Dispatch lab results via Email",
      desc: "Send PDF report copy to the referring physician once results are validated.",
      icon: Mail,
    },
  ];

  const operationsSettings = [
    {
      key: "pharmacyBarcodeRequired" as const,
      label: "Mandatory barcode scanning",
      desc: "Require pharmacists to scan barcodes on shelves before dispensing drugs.",
      icon: Barcode,
    },
  ];

  return (
    <div className="max-w-3xl space-y-6" data-testid="admin-settings">
      <div className="surface p-5 flex items-center gap-4 shadow-soft border border-ink-100 relative overflow-hidden">
        <div className="h-10 w-10 rounded bg-plum-soft text-plum grid place-items-center shrink-0 overflow-hidden">
          {logoPreview ? (
            <img src={logoPreview} alt="" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-ink-400 font-semibold">
            Active Profile
          </div>
          <h3 className="font-heading font-semibold text-ink-950 text-[15px]">{hospital.name}</h3>
          <p className="text-[11px] text-ink-400 mt-0.5">
            Plan {license.plan} · seats staff {seats.staff} / doctors {seats.doctors}
          </p>
        </div>
      </div>

      <div className="surface overflow-hidden shadow-soft border border-ink-100">
        <div className="border-b border-ink-100 px-5 py-3 bg-bone/25 text-[10px] font-bold uppercase tracking-wider text-ink-400">
          White-label & billing
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ImagePlus className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-ink-900 text-[13.5px]">Hospital logo</div>
                <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">
                  {canWhiteLabel
                    ? "Upload a square PNG/SVG under 400KB for desk sidebars."
                    : "Included on Enterprise (white_label module)."}
                </p>
              </div>
            </div>
            <label
              className={`rounded-md border border-ink-100 bg-white px-3 py-2 text-[12px] font-medium ${
                canWhiteLabel ? "cursor-pointer" : "pointer-events-none opacity-50"
              }`}
            >
              Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-50 pt-4">
            <div>
              <div className="font-semibold text-ink-900 text-[13.5px]">Subscription portal</div>
              <p className="text-[12px] text-ink-500 mt-0.5">
                Manage seats and payment method via Stripe when configured.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              className="rounded-md border border-ink-100 bg-white px-3 py-2 text-[12px] font-medium"
            >
              Open billing
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="surface overflow-hidden shadow-soft border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-3 bg-bone/25 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Billing & Invoicing Rules
          </div>
          <div className="divide-y divide-stone-100">
            {billingSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-start justify-between gap-5 px-5 py-4">
                  <div className="flex gap-3 items-start">
                    <Icon className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-ink-900 text-[13.5px]">{item.label}</div>
                      <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-10 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-plum peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface overflow-hidden shadow-soft border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-3 bg-bone/25 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Clinical Notifications
          </div>
          <div className="divide-y divide-stone-100">
            {clinicalSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-start justify-between gap-5 px-5 py-4">
                  <div className="flex gap-3 items-start">
                    <Icon className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-ink-900 text-[13.5px]">{item.label}</div>
                      <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-10 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-plum peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface overflow-hidden shadow-soft border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-3 bg-bone/25 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Pharmacy Dispense Control
          </div>
          <div className="divide-y divide-stone-100">
            {operationsSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-start justify-between gap-5 px-5 py-4">
                  <div className="flex gap-3 items-start">
                    <Icon className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-ink-900 text-[13.5px]">{item.label}</div>
                      <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-10 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-plum peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-md border border-plum/10 bg-plum px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-soft transition hover:bg-plum-soft hover:text-plum"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Configuration..." : "Save Config Settings"}
        </button>
      </div>
    </div>
  );
}

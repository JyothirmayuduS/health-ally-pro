import { useState } from "react";
import { loadHospital } from "@/lib/admin-desk/config";
import { toast } from "sonner";
import { Settings, ShieldAlert, Building2, Save, CreditCard, Mail, Barcode } from "lucide-react";

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

  const toggle = (key: keyof AdminSettings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const save = () => {
    setIsSaving(true);
    saveSettings(settings);
    toast.success("Hospital system configuration saved");
    setTimeout(() => setIsSaving(false), 800);
  };

  // Group settings for better visual categorization
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
      {/* Header Profile card */}
      <div className="surface p-5 flex items-center gap-4 shadow-soft border border-ink-100 relative overflow-hidden">
        <div className="h-10 w-10 rounded bg-plum-soft text-plum grid place-items-center shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-ink-400 font-semibold">Active Profile</div>
          <h3 className="font-heading font-semibold text-ink-950 text-[15px]">{hospital.name}</h3>
        </div>
      </div>

      {/* Structured Category Groups */}
      <div className="space-y-5">
        {/* Billing Policy */}
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
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-plum"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Operations */}
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
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-plum"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispensing Rules */}
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
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={() => toggle(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-plum"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button Action */}
      <div className="flex justify-end pt-3">
        <button
          onClick={save}
          className="rounded-md bg-plum px-5 py-2.5 text-[12.5px] font-semibold text-white hover:bg-plum-soft hover:text-plum transition flex items-center gap-1.5 shadow-soft border border-plum/10"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Configuration..." : "Save Config Settings"}
        </button>
      </div>
    </div>
  );
}

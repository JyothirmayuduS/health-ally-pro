import { useState } from "react";
import { loadHospital } from "@/lib/admin-desk/config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings } from "lucide-react";

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

  const toggle = (key: keyof AdminSettings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const save = () => {
    saveSettings(settings);
    toast.success("Settings saved");
  };

  const rows: { key: keyof AdminSettings; label: string; desc: string }[] = [
    {
      key: "autoInvoiceOnCheckIn",
      label: "Auto-invoice on check-in",
      desc: "Create consultation invoice when patient checks in at reception.",
    },
    {
      key: "requireInsurance",
      label: "Require insurance capture",
      desc: "Block billing until policy ID is recorded for insured visits.",
    },
    {
      key: "labResultsEmail",
      label: "Email lab results",
      desc: "Notify ordering doctor when validated results are released.",
    },
    {
      key: "pharmacyBarcodeRequired",
      label: "Barcode scan on dispense",
      desc: "Require shelf scan before controlled substance handoff.",
    },
  ];

  return (
    <div className="max-w-2xl space-y-5" data-testid="admin-settings">
      <div className="surface flex items-center gap-3 px-5 py-4">
        <Settings className="h-4 w-4 text-plum" />
        <div>
          <div className="font-mono text-[10px] uppercase text-ink-400">Hospital</div>
          <div className="font-heading font-semibold">{hospital.name}</div>
        </div>
      </div>

      <div className="surface divide-y divide-ink-100 overflow-hidden">
        {rows.map((r) => (
          <label
            key={r.key}
            className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-bone/40"
          >
            <div>
              <div className="font-medium text-ink-900">{r.label}</div>
              <p className="mt-0.5 text-[12px] text-ink-500">{r.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={settings[r.key]}
              onChange={() => toggle(r.key)}
              className="mt-1 h-4 w-4 accent-plum"
            />
          </label>
        ))}
      </div>
      <Button className="btn-primary h-10" onClick={save}>
        Save settings
      </Button>
    </div>
  );
}

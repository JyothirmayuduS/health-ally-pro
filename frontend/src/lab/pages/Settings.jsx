// Lab supervisor → settings page (now also showing live team)
import { useLab } from "@/lab/store";
import { SectionLabel } from "@/lab/components/Pills";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings2, AlertOctagon, Bell, Printer, Building2, Users2 } from "lucide-react";
import { Link } from "react-router-dom";

const SECTIONS = [
  { id: "hematology", label: "Hematology", tat: "2h" },
  { id: "biochemistry", label: "Biochemistry", tat: "4h" },
  { id: "microbiology", label: "Microbiology", tat: "48h" },
  { id: "serology", label: "Serology", tat: "6h" },
  { id: "urinalysis", label: "Urinalysis", tat: "2h" },
  { id: "endocrinology", label: "Endocrinology", tat: "6h" },
];

export default function Settings() {
  const { hospital, staff } = useLab();
  return (
    <div className="space-y-6" data-testid="settings-page">
      <SectionLabel>Settings &amp; operations</SectionLabel>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Lab profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Hospital</span><span className="font-medium">{hospital.name}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Director</span><span>{hospital.lab_director}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">CLIA</span><span className="font-mono">{hospital.clia}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-[var(--sage-700)]" />
              <h3 className="font-display font-semibold">Team</h3>
            </div>
            <Link to="/admin/users" className="text-xs font-mono uppercase tracking-wider text-[var(--sage-700)] hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {staff.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between text-sm">
                <span className="truncate">{s.name}</span>
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wide">{s.role?.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Critical value rules</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-alert supervisor</div>
                <div className="text-xs text-stone-500">Surface critical values on validation queue</div>
              </div>
              <Switch defaultChecked data-testid="toggle-auto-alert" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dual sign-off for criticals</div>
                <div className="text-xs text-stone-500">Require supervisor approval on panic values</div>
              </div>
              <Switch defaultChecked data-testid="toggle-dual-signoff" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Notifications</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><div>STAT order alert sound</div><Switch defaultChecked data-testid="toggle-stat-sound" /></div>
            <div className="flex items-center justify-between"><div>Email validated reports to ordering doctor</div><Switch defaultChecked data-testid="toggle-email-doctor" /></div>
            <div className="flex items-center justify-between"><div>SMS patient on result release</div><Switch data-testid="toggle-sms-patient" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Printer className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Label printer</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div><Label className="text-xs">Default template</Label><Input defaultValue="MEDORA-STD-340x200" className="font-mono mt-1" data-testid="label-template" /></div>
            <div><Label className="text-xs">Printer queue</Label><Input defaultValue="lab-printer-01" className="font-mono mt-1" data-testid="printer-queue" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">TAT targets</h3>
          </div>
          <div className="space-y-2 text-sm">
            {SECTIONS.map((s) => (
              <div key={s.id} className="flex justify-between"><span>{s.label}</span><span className="font-mono">{s.tat}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

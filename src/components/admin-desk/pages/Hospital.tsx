import { useState } from "react";
import { loadHospital, saveHospital, type HospitalProfile } from "@/lib/admin-desk/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export default function AdminHospital() {
  const [form, setForm] = useState<HospitalProfile>(() => loadHospital());

  const save = () => {
    saveHospital(form);
    toast.success("Hospital profile saved");
  };

  const field = (key: keyof HospitalProfile, label: string) => (
    <label className="block">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
        {label}
      </span>
      <Input
        className="mt-1.5 border-ink-200 bg-white"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="max-w-2xl" data-testid="admin-hospital">
      <div className="surface p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-plum" />
          <h2 className="font-heading text-[15px] font-semibold">Facility profile</h2>
        </div>
        <div className="space-y-4">
          {field("name", "Display name")}
          {field("legalName", "Legal name")}
          {field("address", "Address")}
          {field("phone", "Phone")}
          {field("email", "Email")}
          {field("registrationNo", "Registration no.")}
          {field("timezone", "Timezone")}
        </div>
        <Button className="btn-primary mt-6 h-10" onClick={save}>
          Save profile
        </Button>
      </div>
    </div>
  );
}

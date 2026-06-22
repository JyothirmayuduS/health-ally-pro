// Doctor place-order — pick patient + test + priority
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLab } from "@/lab/store";
import { createOrder, createPatient } from "@/lab/api";
import { SectionLabel } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardPlus, UserPlus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DoctorNewOrder() {
  const { patients, catalog, reload, findCatalog } = useLab();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [testCode, setTestCode] = useState("");
  const [priority, setPriority] = useState("routine");
  const [fasting, setFasting] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [np, setNp] = useState({ name: "", age: "", sex: "F", phone: "" });

  useEffect(() => {
    if (testCode) {
      const cat = findCatalog(testCode);
      setFasting(Boolean(cat?.fasting));
    }
  }, [testCode, findCatalog]);

  const submit = async () => {
    if (!patientId || !testCode) return;
    setSubmitting(true);
    try {
      const o = await createOrder({ patient_id: patientId, test_code: testCode, priority, fasting, notes });
      toast.success(`Order ${o.id} placed`);
      await reload();
      navigate("/doctor", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  const createNewPatient = async () => {
    if (!np.name || !np.age) { toast.error("Name and age required"); return; }
    try {
      const p = await createPatient({ name: np.name, age: parseInt(np.age, 10), sex: np.sex, phone: np.phone });
      await reload();
      setPatientId(p.id);
      setShowNew(false);
      toast.success(`Patient ${p.name} added`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create patient");
    }
  };

  const cat = findCatalog(testCode);

  return (
    <div className="space-y-6" data-testid="doctor-new-order">
      <SectionLabel>Place a lab order</SectionLabel>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 space-y-5">
          {/* Patient picker */}
          <div>
            <Label className="text-xs">Patient</Label>
            <div className="flex gap-2 mt-1">
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="flex-1 border-stone-200" data-testid="patient-select">
                  <SelectValue placeholder="Choose patient…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.mrn} · {p.age}{p.sex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-stone-200" onClick={() => setShowNew((s) => !s)} data-testid="toggle-new-patient">
                <UserPlus className="h-4 w-4 mr-1.5" /> New
              </Button>
            </div>
            {showNew && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200" data-testid="new-patient-form">
                <Input placeholder="Full name" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} className="md:col-span-2" data-testid="np-name" />
                <Input placeholder="Age" type="number" value={np.age} onChange={(e) => setNp({ ...np, age: e.target.value })} data-testid="np-age" />
                <Select value={np.sex} onValueChange={(v) => setNp({ ...np, sex: v })}>
                  <SelectTrigger data-testid="np-sex"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Phone" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} className="md:col-span-3" data-testid="np-phone" />
                <Button onClick={createNewPatient} className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="save-new-patient">Add</Button>
              </div>
            )}
          </div>

          {/* Test grid */}
          <div>
            <Label className="text-xs">Test</Label>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {catalog.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => setTestCode(t.code)}
                  data-testid={`test-${t.code}`}
                  className={cn("text-left px-4 py-3 rounded-lg border transition group",
                    testCode === t.code ? "border-[var(--sage-700)] bg-[var(--sage-50)] ring-2 ring-[var(--sage-300)]" : "border-stone-200 bg-white hover:border-stone-300")}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[var(--ink)]">{t.name}</div>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-[11px] font-mono text-stone-500 mt-0.5">{t.code} · {t.section} · TAT {t.tat_hours}h</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 border-stone-200" data-testid="priority-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 mt-2 sm:mt-0">
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} data-testid="fasting-checkbox" />
                Patient is fasting
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs">Clinical notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Suspected diagnosis, prior labs, allergies…" data-testid="notes-input" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="ghost" onClick={() => navigate("/doctor")}>Cancel</Button>
            <Button onClick={submit} disabled={!patientId || !testCode || submitting} className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="submit-order-btn">
              <ClipboardPlus className="h-4 w-4 mr-1.5" /> Submit order
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-2">Order summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Patient</span><b className="text-right">{patients.find((p) => p.id === patientId)?.name || "—"}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Test</span><b className="text-right">{cat?.name || "—"}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Sample</span><span className="text-right text-xs">{cat?.sample_type || "—"}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">TAT</span><span>{cat?.tat_hours ? `${cat.tat_hours}h` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Priority</span><span className="capitalize">{priority}</span></div>
              <div className="flex justify-between border-t border-stone-100 pt-2 mt-2"><span className="text-stone-500">Charge</span><b className="font-mono">${cat?.price ?? "—"}</b></div>
            </div>
          </div>
          {cat?.fasting && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              ⚠ Fasting required (8h) for {cat.name}. Confirm patient has fasted.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

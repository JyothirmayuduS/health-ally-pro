// Reception walk-in form — register patient + order test in one go
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLab } from "@/lab/store";
import { createWalkin } from "@/lab/api";
import { SectionLabel } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardPlus, UserPlus, ChevronRight, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReceptionWalkin() {
  const { catalog, reload, findCatalog } = useLab();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", age: "", sex: "F", phone: "", mrn: "" });
  const [testCode, setTestCode] = useState("");
  const [priority, setPriority] = useState("routine");
  const [fasting, setFasting] = useState(false);
  const [notes, setNotes] = useState("Walk-in lab");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (testCode) {
      const cat = findCatalog(testCode);
      setFasting(Boolean(cat?.fasting));
    }
  }, [testCode, findCatalog]);

  const cat = findCatalog(testCode);
  const isValid = form.name && form.age && testCode;

  const submit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const o = await createWalkin({
        patient: { name: form.name, age: parseInt(form.age, 10), sex: form.sex, phone: form.phone, mrn: form.mrn || undefined },
        test_code: testCode, priority, fasting, notes,
      });
      toast.success(`Walk-in ${o.id} placed`);
      await reload();
      navigate("/reception", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="reception-walkin">
      <SectionLabel>Quick walk-in registration</SectionLabel>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 space-y-5">
          {/* Patient form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-[var(--sage-700)]" />
              <h3 className="font-display font-semibold">Patient details</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Full name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="wi-name" />
              </div>
              <div>
                <Label className="text-xs">Age *</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} data-testid="wi-age" />
              </div>
              <div>
                <Label className="text-xs">Sex</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger data-testid="wi-sex"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="X">Other / Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="wi-phone" />
              </div>
              <div>
                <Label className="text-xs">MRN (optional — auto-assigned)</Label>
                <Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} placeholder="MR-XXXXXX" className="font-mono" data-testid="wi-mrn" />
              </div>
            </div>
          </div>

          {/* Test picker */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardPlus className="h-4 w-4 text-[var(--sage-700)]" />
              <h3 className="font-display font-semibold">Lab test</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {catalog.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => setTestCode(t.code)}
                  data-testid={`wi-test-${t.code}`}
                  className={cn("text-left px-4 py-3 rounded-lg border transition group",
                    testCode === t.code ? "border-[var(--sage-700)] bg-[var(--sage-50)] ring-2 ring-[var(--sage-300)]" : "border-stone-200 bg-white hover:border-stone-300")}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[var(--ink)]">{t.name}</div>
                    <div className="flex items-center gap-1 font-mono text-xs text-[var(--sage-700)]">
                      <DollarSign className="h-3 w-3" />{t.price}
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:translate-x-0.5 transition ml-1" />
                    </div>
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
                <SelectTrigger data-testid="wi-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end mt-1">
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} data-testid="wi-fasting" />
                Fasting
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="wi-notes" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="ghost" onClick={() => navigate("/reception")}>Cancel</Button>
            <Button onClick={submit} disabled={!isValid || submitting} className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="submit-walkin-btn">
              <ClipboardPlus className="h-4 w-4 mr-1.5" /> Register & order
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-2">Receipt preview</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Patient</span><b className="text-right">{form.name || "—"}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Age/Sex</span><span>{form.age || "—"} {form.age && form.sex}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Test</span><b className="text-right">{cat?.name || "—"}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">TAT</span><span>{cat?.tat_hours ? `${cat.tat_hours}h` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Priority</span><span className="capitalize">{priority}</span></div>
              <div className="flex justify-between border-t border-stone-100 pt-2 mt-2"><span className="text-stone-500">Amount due</span><b className="font-mono text-lg text-[var(--sage-700)]">${cat?.price ?? "0"}</b></div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-4">
              Payment integration coming soon · Stripe/Razorpay
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

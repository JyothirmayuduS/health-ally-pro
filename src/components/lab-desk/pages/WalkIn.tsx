import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLabStore } from "@/lib/lab-desk/store";
import { SectionLabel } from "@/components/lab-desk/Pills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardPlus, UserPlus, ChevronRight, DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import type { LabPriority } from "@/lib/lab-desk/mockData";
import type { LabPaymentMethod } from "@/lib/lab-desk/billing";
import { fmtLabPrice } from "@/lib/lab-desk/billing";

export default function WalkIn() {
  const { catalog, findCatalog, addWalkIn, collectLabPayment, flagInvoiceForReception } =
    useLabStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", age: "", sex: "F", phone: "", mrn: "" });
  const [testCode, setTestCode] = useState("");
  const [priority, setPriority] = useState<LabPriority>("routine");
  const [fasting, setFasting] = useState(false);
  const [notes, setNotes] = useState("Walk-in lab");
  const [pending, setPending] = useState<{
    orderId: string;
    invoiceId: string;
    amount: number;
    testName: string;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<LabPaymentMethod>("cash");

  useEffect(() => {
    if (testCode) {
      const cat = findCatalog(testCode);
      setFasting(Boolean(cat?.fasting));
    }
  }, [testCode, findCatalog]);

  const cat = findCatalog(testCode);
  const isValid = form.name && form.age && testCode;

  const submit = () => {
    if (!isValid) return;
    const { order, invoice } = addWalkIn({
      name: form.name,
      age: parseInt(form.age, 10),
      sex: form.sex,
      phone: form.phone,
      mrn: form.mrn || undefined,
      testCode,
      priority,
      fasting,
      notes,
    });
    setPending({
      orderId: order.id,
      invoiceId: invoice.id,
      amount: invoice.amount,
      testName: invoice.test_name,
    });
    toast.success(`Walk-in ${order.id} placed — collect payment`);
  };

  const payAndContinue = () => {
    if (!pending) return;
    collectLabPayment(pending.invoiceId, payMethod);
    toast.success("Payment collected");
    navigate({ to: "/lab/collection" });
  };

  const deferToReception = () => {
    if (!pending) return;
    flagInvoiceForReception(pending.invoiceId);
    navigate({ to: "/lab/collection" });
  };

  if (pending) {
    return (
      <div className="space-y-6" data-testid="lab-walkin-pay">
        <SectionLabel>Walk-in payment</SectionLabel>
        <div className="surface max-w-lg space-y-5 p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sage" />
            <h2 className="font-heading text-lg font-semibold">Collect before collection</h2>
          </div>
          <p className="text-[13px] text-ink-600">
            Order <span className="font-mono">{pending.orderId}</span> · {pending.testName}
          </p>
          <div className="rounded-lg bg-stone-50 px-4 py-3 font-mono text-2xl font-semibold text-sage">
            {fmtLabPrice(pending.amount)}
          </div>
          <div>
            <Label className="text-xs">Payment method</Label>
            <Select value={payMethod} onValueChange={(v) => setPayMethod(v as LabPaymentMethod)}>
              <SelectTrigger className="mt-1 border-ink-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="btn-primary" onClick={payAndContinue}>
              Collect & go to collection
            </Button>
            <Button variant="outline" className="border-ink-200" onClick={deferToReception}>
              Bill at reception
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/lab/collection" })}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="lab-walkin">
      <SectionLabel>Quick walk-in registration</SectionLabel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface space-y-5 p-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-sage" />
              <h3 className="font-heading font-semibold text-ink-900">Patient details</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs">Full name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="wi-name"
                  className="mt-1 border-ink-200"
                />
              </div>
              <div>
                <Label className="text-xs">Age *</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  data-testid="wi-age"
                  className="mt-1 border-ink-200"
                />
              </div>
              <div>
                <Label className="text-xs">Sex</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger data-testid="wi-sex" className="mt-1 border-ink-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="O">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="wi-phone"
                  className="mt-1 border-ink-200"
                />
              </div>
              <div>
                <Label className="text-xs">MRN (optional)</Label>
                <Input
                  value={form.mrn}
                  onChange={(e) => setForm({ ...form, mrn: e.target.value })}
                  data-testid="wi-mrn"
                  className="mt-1 border-ink-200"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardPlus className="h-4 w-4 text-sage" />
              <h3 className="font-heading font-semibold text-ink-900">Lab order</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs">Test *</Label>
                <Select value={testCode} onValueChange={setTestCode}>
                  <SelectTrigger data-testid="wi-test" className="mt-1 border-ink-200">
                    <SelectValue placeholder="Select test…" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.code} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as LabPriority)}>
                  <SelectTrigger data-testid="wi-priority" className="mt-1 border-ink-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={fasting}
                    onChange={(e) => setFasting(e.target.checked)}
                    data-testid="wi-fasting"
                  />
                  Fasting required
                </label>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="wi-notes"
                  className="mt-1 border-ink-200"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!isValid}
            onClick={submit}
            className="btn-primary h-10 w-full sm:w-auto"
            data-testid="wi-submit"
          >
            Place walk-in order <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-sage" />
            <h3 className="font-heading font-semibold text-ink-900">Order summary</h3>
          </div>
          {cat ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400">Test</div>
                <div className="font-medium">{cat.name}</div>
                <div className="font-mono text-xs text-ink-400">{cat.code}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-ink-400">TAT</span>
                  <div className="font-medium">{cat.tat_hours}h</div>
                </div>
                <div>
                  <span className="text-ink-400">Price</span>
                  <div className="font-medium">{fmtLabPrice(cat.price)}</div>
                </div>
              </div>
              <div className="text-xs text-ink-600">{cat.sample_type}</div>
            </div>
          ) : (
            <p className="text-sm text-ink-400">Select a test to see details.</p>
          )}
          <Link to="/lab/catalog" className="mt-4 inline-block text-xs font-medium text-sage hover:underline">
            Browse full catalog →
          </Link>
        </div>
      </div>
    </div>
  );
}

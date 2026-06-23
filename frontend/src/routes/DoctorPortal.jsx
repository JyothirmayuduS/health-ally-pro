// Minimal doctor portal stub that demonstrates the doctor → pharmacy handoff.
// Uses the same PharmacyProvider so localStorage state is shared.

import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PharmacyProvider, usePharmacy } from "@/lib/pharmacy-desk/store";
import { useAuth } from "@/lib/auth/authContext";
import { Stethoscope, Send, LogOut } from "lucide-react";
import { fmt } from "@/lib/pharmacy-desk/utils";
import { StatusBadge } from "@/components/pharmacy-desk/StatusBadge";

export default function DoctorPortal() {
  const { user, hydrated, requirePortalAccess, signOut } = useAuth();
  const location = useLocation();

  if (!hydrated) return null;
  const access = requirePortalAccess("doctor");
  if (!access.ok) {
    return <Navigate to="/login" replace state={{ from: location.pathname, portal: "doctor" }} />;
  }

  return (
    <PharmacyProvider>
      <div data-testid="doctor-portal-root" className="min-h-screen bg-background">
        <header className="bg-[hsl(var(--paper-100))]/60 border-b border-border/70">
          <div className="max-w-[1100px] mx-auto px-8 py-5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--sage-500))] flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-[hsl(var(--paper-50))]" />
            </div>
            <div className="flex-1">
              <div className="font-display text-[20px] leading-tight">Doctor portal · e-Prescribe (stub)</div>
              <div className="text-[12px] text-muted-foreground">
                {user?.name} · {user?.title} — demonstrates the handoff into the pharmacy inbox.
              </div>
            </div>
            <button
              onClick={signOut}
              data-testid="doctor-sign-out"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-[hsl(var(--paper-200))]/60"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>

        <DoctorPrescribe />
      </div>
    </PharmacyProvider>
  );
}

function DoctorPrescribe() {
  const ph = usePharmacy();
  const { user } = useAuth();
  const [form, setForm] = useState({
    patientId: ph.patients[0]?.id || "",
    drugId: ph.inventory[0]?.id || "",
    dosage: "500 mg",
    frequency: "Twice daily",
    duration: "7 days",
    quantity: 14,
    instructions: "Take with food.",
    priority: "routine",
    notes: "",
  });

  const submit = () => {
    const drug = ph.getDrug(form.drugId);
    ph.submitFromDoctor({
      patientId: form.patientId,
      doctorId: user?.id || "stf_doc_01",
      priority: form.priority,
      notes: form.notes,
      items: [
        {
          drugId: form.drugId,
          medicationName: drug?.name || "Medication",
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
          quantity: Number(form.quantity) || 1,
          instructions: form.instructions,
        },
      ],
      refillsAllowed: 2,
    });
    setForm((f) => ({ ...f, notes: "" }));
  };

  const recent = ph.prescriptions
    .filter((r) => r.prescribedByStaffId === (user?.id || "stf_doc_01"))
    .slice(0, 6);

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      <section className="pharm-card p-6">
        <h2 className="font-display text-[22px] mb-1">New prescription</h2>
        <p className="text-[12px] text-muted-foreground mb-5">Submit this form to push the Rx into the pharmacy inbox in real time.</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient</label>
            <select
              data-testid="rx-form-patient"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="pharm-input mt-1"
            >
              {ph.patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Medication</label>
            <select
              data-testid="rx-form-drug"
              value={form.drugId}
              onChange={(e) => {
                const d = ph.getDrug(e.target.value);
                setForm({ ...form, drugId: e.target.value, dosage: d?.strength || form.dosage });
              }}
              className="pharm-input mt-1"
            >
              {ph.inventory.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.strength} ({d.form})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Dosage</label>
            <input className="pharm-input mt-1" data-testid="rx-form-dosage"
              value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Frequency</label>
            <input className="pharm-input mt-1" data-testid="rx-form-frequency"
              value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Duration</label>
            <input className="pharm-input mt-1" data-testid="rx-form-duration"
              value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quantity</label>
            <input type="number" className="pharm-input mt-1" data-testid="rx-form-qty"
              value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Instructions</label>
            <input className="pharm-input mt-1" data-testid="rx-form-instructions"
              value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Priority</label>
            <select className="pharm-input mt-1" data-testid="rx-form-priority"
              value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent / STAT</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Note for pharmacy</label>
            <input className="pharm-input mt-1" data-testid="rx-form-notes"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <button
          onClick={submit}
          data-testid="rx-form-submit"
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors"
        >
          <Send className="h-4 w-4" /> Send to pharmacy
        </button>
      </section>

      <aside className="pharm-card p-4">
        <h3 className="font-display text-[16px] mb-3">Your recent prescriptions</h3>
        <ul className="space-y-3">
          {recent.length === 0 && (
            <li className="text-[12px] text-muted-foreground py-4 text-center">No prescriptions yet.</li>
          )}
          {recent.map((rx) => {
            const p = ph.getPatient(rx.patientId);
            return (
              <li key={rx.id} className="border-b border-border/60 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={rx.status} />
                  <span className="text-[11px] text-muted-foreground">{fmt.relative(rx.createdAt)}</span>
                </div>
                <div className="mt-1 text-[13px] font-medium">{p?.name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {rx.items[0].medicationName} · {rx.items[0].dosage}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

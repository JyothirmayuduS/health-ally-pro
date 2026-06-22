import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { BLOOD_GROUPS, GENDERS } from "@/lib/mockData";
import { toast } from "sonner";
import { UserPlus, Upload, AlertTriangle, Check } from "lucide-react";

const Field = ({ label, required, children, hint }) => (
  <label className="block">
    <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
      {label} {required && <span className="text-status-noshowText">*</span>}
    </div>
    {children}
    {hint && <div className="text-[11px] text-ink-400 mt-1">{hint}</div>}
  </label>
);

const inputCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage placeholder:text-ink-400";

export default function Register() {
  const { addPatient, findDuplicate } = useStore();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "Female",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    bloodGroup: "O+",
    allergies: "",
    insuranceProvider: "",
    policyId: "",
  });
  const [duplicate, setDuplicate] = useState(null);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "phone" || k === "name" || k === "dob") {
      const dupe = findDuplicate(
        k === "phone" ? v : form.phone,
        k === "name" ? v : form.name,
        k === "dob" ? v : form.dob,
      );
      setDuplicate(dupe || null);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.dob) {
      toast.error("Name, DOB and phone are required");
      return;
    }
    const newP = addPatient({
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      phone: form.phone,
      email: form.email || "—",
      address: form.address,
      emergency: {
        name: form.emergencyName,
        phone: form.emergencyPhone,
        relation: form.emergencyRelation,
      },
      bloodGroup: form.bloodGroup,
      allergies: form.allergies || "—",
      insurance: {
        provider: form.insuranceProvider || "Self-pay",
        policyId: form.policyId || "—",
      },
    });
    toast.success(`${newP.name} registered`, { description: `MRN ${newP.id}` });
    nav("/reception/patients");
  };

  return (
    <form
      data-testid="register-page"
      onSubmit={onSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-5"
    >
      <div className="lg:col-span-2 space-y-5">
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                Section 1
              </div>
              <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
                Demographics
              </h2>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input
                data-testid="reg-name"
                value={form.name}
                onChange={set("name")}
                className={inputCls}
                placeholder="e.g. Anjali Krishnan"
              />
            </Field>
            <Field label="Date of birth" required>
              <input
                data-testid="reg-dob"
                type="date"
                value={form.dob}
                onChange={set("dob")}
                className={inputCls}
              />
            </Field>
            <Field label="Gender" required>
              <select
                data-testid="reg-gender"
                value={form.gender}
                onChange={set("gender")}
                className={inputCls}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phone" required>
              <input
                data-testid="reg-phone"
                value={form.phone}
                onChange={set("phone")}
                className={inputCls}
                placeholder="+91 …"
              />
            </Field>
            <Field label="Email">
              <input
                data-testid="reg-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="optional"
              />
            </Field>
            <Field label="Address">
              <input
                data-testid="reg-address"
                value={form.address}
                onChange={set("address")}
                className={inputCls}
                placeholder="Street, area, city"
              />
            </Field>
          </div>
        </section>

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Section 2
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Emergency contact
            </h2>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4">
            <Field label="Contact name">
              <input
                data-testid="reg-em-name"
                value={form.emergencyName}
                onChange={set("emergencyName")}
                className={inputCls}
              />
            </Field>
            <Field label="Contact phone">
              <input
                data-testid="reg-em-phone"
                value={form.emergencyPhone}
                onChange={set("emergencyPhone")}
                className={inputCls}
              />
            </Field>
            <Field label="Relation">
              <input
                data-testid="reg-em-relation"
                value={form.emergencyRelation}
                onChange={set("emergencyRelation")}
                className={inputCls}
                placeholder="Spouse, Parent…"
              />
            </Field>
          </div>
        </section>

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Section 3
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Medical & insurance
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <Field label="Blood group">
              <select
                data-testid="reg-blood"
                value={form.bloodGroup}
                onChange={set("bloodGroup")}
                className={inputCls}
              >
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Allergies">
              <input
                data-testid="reg-allergies"
                value={form.allergies}
                onChange={set("allergies")}
                className={inputCls}
                placeholder="None, or comma-separated"
              />
            </Field>
            <Field label="Insurance provider">
              <input
                data-testid="reg-ins-provider"
                value={form.insuranceProvider}
                onChange={set("insuranceProvider")}
                className={inputCls}
                placeholder="e.g. Star Health"
              />
            </Field>
            <Field label="Policy ID">
              <input
                data-testid="reg-policy"
                value={form.policyId}
                onChange={set("policyId")}
                className={inputCls}
                placeholder="Policy / member ID"
              />
            </Field>
          </div>
        </section>
      </div>

      {/* Side rail */}
      <aside className="space-y-5">
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              ID / Photo
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Identification
            </h2>
          </div>
          <div className="p-5">
            <button
              type="button"
              data-testid="reg-upload-id"
              className="w-full border border-dashed border-ink-200 rounded-sm py-8 flex flex-col items-center gap-2 text-ink-600 hover:border-sage hover:text-sage transition"
            >
              <Upload className="w-5 h-5" />
              <div className="text-[12.5px] font-medium">Upload ID / scan</div>
              <div className="text-[11px] text-ink-400">JPG, PNG, PDF · max 5 MB</div>
            </button>
          </div>
        </section>

        {duplicate ? (
          <section
            data-testid="reg-duplicate"
            className="border border-status-waitBorder bg-status-waitBg/60 rounded-sm p-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-status-waitText" />
              <div>
                <div className="text-[12.5px] font-medium text-status-waitText">
                  Possible duplicate
                </div>
                <div className="text-[12px] text-ink-600 mt-1">
                  {duplicate.name} ({duplicate.id}) · {duplicate.phone}
                </div>
                <div className="text-[11px] text-ink-400 mt-1">
                  Verify before creating a new record.
                </div>
              </div>
            </div>
          </section>
        ) : (
          form.phone || form.name ? (
            <section className="border border-status-doneBorder bg-status-doneBg/40 rounded-sm p-4 flex items-start gap-2.5">
              <Check className="w-4 h-4 mt-0.5 text-status-doneText" />
              <div>
                <div className="text-[12.5px] font-medium text-status-doneText">
                  No duplicates found
                </div>
                <div className="text-[11px] text-ink-400 mt-1">
                  We checked phone, name and DOB.
                </div>
              </div>
            </section>
          ) : null
        )}

        <div className="surface p-5 sticky top-24">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Review
          </div>
          <div className="text-[13px] text-ink-600 mt-2 leading-relaxed">
            MRN will be auto-generated on submit. Patient will be searchable immediately.
          </div>
          <button
            type="submit"
            data-testid="reg-submit"
            className="mt-4 w-full h-10 bg-sage hover:bg-sage-hover text-white text-[13px] font-medium rounded-sm flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Register patient
          </button>
          <button
            type="button"
            data-testid="reg-cancel"
            onClick={() => nav(-1)}
            className="mt-2 w-full h-9 text-[13px] text-ink-600 hover:text-ink-900 hover:bg-bone rounded-sm"
          >
            Cancel
          </button>
        </div>
      </aside>
    </form>
  );
}

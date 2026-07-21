import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Plus,
  Stethoscope,
  X,
} from "lucide-react";
import {
  SPECIALTY_LIST,
  addHospitalDoctor,
  loadHospitalDoctors,
  subscribeHospitalDoctors,
  updateHospitalDoctor,
  type HospitalDoctorRecord,
  type SpecialtyId,
} from "@/lib/specialties";
import { loadRoster } from "@/lib/admin-desk/doctorRosterData";
import { toast } from "sonner";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<HospitalDoctorRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const roster = loadRoster();

  const refresh = () => setDoctors(loadHospitalDoctors());

  useEffect(() => {
    refresh();
    return subscribeHospitalDoctors(refresh);
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    specialtyId: "general_medicine" as SpecialtyId,
    room: "",
    fee: 600,
    phone: "",
    registrationNo: "",
    linkDemoDoctor: false,
  });

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      specialtyId: "general_medicine",
      room: "",
      fee: 600,
      phone: "",
      registrationNo: "",
      linkDemoDoctor: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (doc: HospitalDoctorRecord) => {
    setEditingId(doc.doctorId);
    setForm({
      name: doc.name,
      email: doc.email,
      specialtyId: doc.specialtyId,
      room: doc.room,
      fee: doc.fee,
      phone: doc.phone ?? "",
      registrationNo: doc.registrationNo ?? "",
      linkDemoDoctor: doc.authUserId === "demo-doctor",
    });
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (editingId) {
      updateHospitalDoctor(editingId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        specialtyId: form.specialtyId,
        room: form.room.trim() || SPECIALTY_LIST.find((s) => s.id === form.specialtyId)?.unitLabel || "OPD",
        fee: form.fee,
        phone: form.phone.trim() || undefined,
        registrationNo: form.registrationNo.trim() || undefined,
        authUserId: form.linkDemoDoctor ? "demo-doctor" : undefined,
      });
      // Unlink demo-doctor from others when reassigned
      if (form.linkDemoDoctor) {
        for (const d of loadHospitalDoctors()) {
          if (d.doctorId !== editingId && d.authUserId === "demo-doctor") {
            updateHospitalDoctor(d.doctorId, { authUserId: undefined });
          }
        }
        updateHospitalDoctor(editingId, { authUserId: "demo-doctor" });
      }
      toast.success("Doctor updated — specialty desk will follow assignment");
    } else {
      const created = addHospitalDoctor({
        name: form.name,
        email: form.email,
        specialtyId: form.specialtyId,
        room: form.room || undefined,
        fee: form.fee,
        phone: form.phone || undefined,
        registrationNo: form.registrationNo || undefined,
        authUserId: form.linkDemoDoctor ? "demo-doctor" : undefined,
      });
      if (form.linkDemoDoctor) {
        for (const d of loadHospitalDoctors()) {
          if (d.doctorId !== created.doctorId && d.authUserId === "demo-doctor") {
            updateHospitalDoctor(d.doctorId, { authUserId: undefined });
          }
        }
      }
      toast.success(`${created.name} added as ${SPECIALTY_LIST.find((s) => s.id === form.specialtyId)?.name}`);
    }
    refresh();
    resetForm();
  };

  const doctorProfiles = useMemo(() => {
    const todayDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    return doctors.map((sf) => {
      const rosterDoc = roster.find((r) => r.doctorId === sf.doctorId);
      const slot = rosterDoc ? rosterDoc.schedule[todayDay] : "off";
      const isWorkingToday = slot !== "off" && slot !== "leave";
      const names = sf.name.replace(/^Dr\.?\s*/i, "").split(" ");
      const initials = names.map((n) => n[0]).join("").slice(0, 2).toUpperCase();
      const specialty = SPECIALTY_LIST.find((s) => s.id === sf.specialtyId);
      return {
        ...sf,
        specialtyName: specialty?.name ?? sf.specialtyId,
        accent: specialty?.accent ?? "#1B3B2E",
        accentSoft: specialty?.accentSoft ?? "#E8EFE6",
        initials,
        shift:
          slot === "off"
            ? "Off Duty"
            : slot === "leave"
              ? "On Leave"
              : `${String(slot).charAt(0).toUpperCase()}${String(slot).slice(1)} Shift`,
        onDuty: isWorkingToday,
      };
    });
  }, [doctors, roster]);

  return (
    <div className="space-y-6" data-testid="admin-doctors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-bone/30 p-4 border border-ink-100 rounded-lg surface">
        <div className="text-[12.5px] text-ink-500">
          Add doctors with a specialty. The doctor portal shows that specialty’s clinical workstation only.
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/services"
            className="rounded-md border border-plum/20 bg-white px-3 py-1.5 text-[12px] font-medium text-plum hover:bg-plum-soft transition flex items-center gap-1 shrink-0"
          >
            Edit fees
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white hover:bg-plum/90 transition flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add doctor
          </button>
        </div>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="surface border border-ink-100 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-ink-950 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-plum" />
              {editingId ? "Edit doctor & specialty" : "New doctor"}
            </h3>
            <button type="button" onClick={resetForm} className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] font-medium text-ink-600">
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
                placeholder="Dr. Ananya Reddy"
              />
            </label>
            <label className="text-[12px] font-medium text-ink-600">
              Login email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
                placeholder="doctor@hospital.com"
              />
            </label>
            <label className="text-[12px] font-medium text-ink-600 sm:col-span-2">
              Specialty (controls doctor-side workstation)
              <select
                value={form.specialtyId}
                onChange={(e) => {
                  const specialtyId = e.target.value as SpecialtyId;
                  const def = SPECIALTY_LIST.find((s) => s.id === specialtyId);
                  setForm((f) => ({
                    ...f,
                    specialtyId,
                    fee: def?.defaultFee ?? f.fee,
                    room: f.room || def?.unitLabel || "",
                  }));
                }}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
              >
                {SPECIALTY_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.tagline}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-medium text-ink-600">
              Consulting room
              <input
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
                placeholder="Eye-1 / Cardio-2"
              />
            </label>
            <label className="text-[12px] font-medium text-ink-600">
              Consult fee (₹)
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: Number(e.target.value) }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
              />
            </label>
            <label className="text-[12px] font-medium text-ink-600">
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
              />
            </label>
            <label className="text-[12px] font-medium text-ink-600">
              Registration no.
              <input
                value={form.registrationNo}
                onChange={(e) => setForm((f) => ({ ...f, registrationNo: e.target.value }))}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px]"
              />
            </label>
          </div>

          <label className="flex items-start gap-2 text-[12.5px] text-ink-600">
            <input
              type="checkbox"
              checked={form.linkDemoDoctor}
              onChange={(e) => setForm((f) => ({ ...f, linkDemoDoctor: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              Link to demo doctor login (<code className="text-[11px]">doctor@oakhaven.demo</code>) so
              that account opens this specialty desk immediately.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-[12px] text-ink-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-plum px-4 py-1.5 text-[12px] font-medium text-white"
            >
              {editingId ? "Save changes" : "Add doctor"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {doctorProfiles.map((doc) => (
          <div
            key={doc.doctorId}
            className="surface relative overflow-hidden p-5 border border-ink-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-plum group"
          >
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ background: doc.onDuty ? doc.accent : "#d6d3d1" }}
            />

            <div className="flex items-start gap-4">
              <div
                className="h-12 w-12 rounded-full grid place-items-center font-heading font-bold text-sm shrink-0 border border-ink-200/50"
                style={{ background: doc.accentSoft, color: doc.accent }}
              >
                {doc.initials}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading font-semibold text-ink-950 text-[14.5px] leading-snug truncate group-hover:text-plum transition-colors">
                    {doc.name}
                  </h3>
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      doc.onDuty ? "bg-teal animate-pulse-dot" : "bg-stone-300"
                    }`}
                    title={doc.onDuty ? "Available" : "Offline"}
                  />
                </div>
                <p className="text-[12.5px] font-medium" style={{ color: doc.accent }}>
                  {doc.specialtyName}
                </p>
                <p className="text-[11px] text-ink-400 font-mono">{doc.doctorId}</p>
                {doc.authUserId === "demo-doctor" ? (
                  <p className="text-[10px] font-medium text-teal">Linked to doctor@oakhaven.demo</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-stone-100 text-[12px] text-ink-600">
              <div className="space-y-0.5">
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">Today</div>
                <div className={`font-semibold capitalize ${doc.onDuty ? "text-ink-800" : "text-ink-400 font-normal"}`}>
                  {doc.shift}
                </div>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-stone-100">
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">Room</div>
                <div className="font-semibold text-ink-800 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-ink-400 shrink-0" />
                  {doc.room}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              <span className="font-mono font-semibold text-[17px] text-money bg-money-soft border border-money/10 rounded px-2.5 py-0.5">
                ₹{doc.fee.toLocaleString("en-IN")}
              </span>
              <button
                type="button"
                onClick={() => openEdit(doc)}
                className="rounded-md border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 hover:border-plum hover:text-plum"
              >
                Edit specialty
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

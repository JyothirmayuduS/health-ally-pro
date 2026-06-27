import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR, TIME_SLOTS } from "@/lib/reception-desk/mockData";
import {
  X,
  Search,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Stethoscope,
  Clock,
  IndianRupee,
  Ticket,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/* ── Avatar colour ring (hashed from name) ─────────────────────────── */
const AVATAR_PALETTES = [
  { bg: "#E8F5F0", text: "#2C7A5B" },
  { bg: "#EEF2FF", text: "#4F46E5" },
  { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#F0FDFA", text: "#0F766E" },
  { bg: "#FDF4FF", text: "#9333EA" },
  { bg: "#FEF9C3", text: "#854D0E" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ── Progress stepper in the header ───────────────────────────────── */
function HeaderStepper({ current }: { current: number }) {
  const steps = ["Patient", "Doctor & Slot", "Confirm"];
  return (
    <div className="flex items-center gap-2 mt-4">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  background: done ? "#fff" : active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: done ? "#1a5c42" : "#fff",
                  border: active ? "1.5px solid rgba(255,255,255,0.8)" : "1.5px solid rgba(255,255,255,0.25)",
                }}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : idx}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{ background: done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Patient result row ────────────────────────────────────────────── */
function PatientRow({ name, id, phone, onSelect }: { name: string; id: string; phone: string; onSelect: () => void }) {
  const pal = getAvatarPalette(name);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full group flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all text-left hover:shadow-md"
      style={{
        border: "1.5px solid #F0F0EE",
        background: "#FAFAF9",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2C7A5B";
        (e.currentTarget as HTMLButtonElement).style.background = "#F0FAF5";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#F0F0EE";
        (e.currentTarget as HTMLButtonElement).style.background = "#FAFAF9";
      }}
    >
      {/* Coloured avatar */}
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0"
        style={{ background: pal.bg, color: pal.text }}
      >
        {getInitials(name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13.5px] text-gray-900 leading-tight">{name}</div>
        <div className="text-[11.5px] text-gray-400 font-mono mt-0.5 truncate">{id} · {phone}</div>
      </div>

      {/* Arrow */}
      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all" style={{ background: "#F0FAF5" }}>
        <ChevronRight className="h-4 w-4" style={{ color: "#2C7A5B" }} />
      </div>
    </button>
  );
}

/* ── Doctor option card ────────────────────────────────────────────── */
function DoctorOption({
  doctor,
  fee,
  selected,
  onSelect,
}: {
  doctor: any;
  fee: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const pal = getAvatarPalette(doctor.name);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all"
      style={{
        border: `1.5px solid ${selected ? "#2C7A5B" : "#F0F0EE"}`,
        background: selected ? "#F0FAF5" : "#FAFAF9",
        boxShadow: selected ? "0 0 0 3px rgba(44,122,91,0.12)" : "none",
      }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0"
        style={selected ? { background: "#2C7A5B", color: "#fff" } : { background: pal.bg, color: pal.text }}
      >
        {getInitials(doctor.name.replace("Dr.", "").trim())}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] text-gray-900">{doctor.name}</div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{doctor.specialty} · Room {doctor.room}</div>
      </div>
      {fee > 0 && (
        <div className="shrink-0 flex items-center gap-0.5 font-bold font-mono text-[13px]" style={{ color: "#1a7a1a" }}>
          <IndianRupee className="h-3.5 w-3.5" />
          {fee}
        </div>
      )}
      {selected && <CheckCircle2 className="h-4 w-4 shrink-0 ml-1" style={{ color: "#2C7A5B" }} />}
    </button>
  );
}

/* ── Confirm detail row ────────────────────────────────────────────── */
function DetailRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-gray-100 last:border-0">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F4F8F6" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <div className="text-[14px] font-semibold text-gray-900 mt-0.5">{value}</div>
      </div>
      {sub && <div className="text-[11px] text-gray-400 font-mono shrink-0">{sub}</div>}
    </div>
  );
}

/* ── Main modal component ──────────────────────────────────────────── */
export default function WalkInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    patients,
    doctors,
    appointments,
    addPatient,
    addAppointment,
    checkInAppointment,
    getConsultFee,
  } = useStore();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"search" | "register">("search");
  const [q, setQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [quick, setQuick] = useState({ name: "", phone: "", dob: "", gender: "Male" });
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [token, setToken] = useState<number | null>(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients.slice(0, 5);
    return patients
      .filter((p) =>
        p.name.toLowerCase().includes(s) || (p.phone || "").includes(s) || p.id.toLowerCase().includes(s)
      )
      .slice(0, 5);
  }, [q, patients]);

  const reset = () => {
    setStep(1); setMode("search"); setQ(""); setSelectedPatient(null);
    setQuick({ name: "", phone: "", dob: "", gender: "Male" });
    setSelectedDoctor(null); setSelectedSlot(null); setToken(null);
  };

  const onQuickRegister = () => {
    if (!quick.name || !quick.phone) return toast.error("Provide name and phone");
    const p = addPatient({ name: quick.name, phone: quick.phone, dob: quick.dob || null, gender: quick.gender });
    setSelectedPatient(p.id);
    toast.success("Patient registered");
    setStep(2);
  };

  const availableSlotsFor = (docId: string) => {
    const used = appointments
      .filter((a) => a.date === TODAY_STR && a.doctorId === docId && a.status !== "cancelled")
      .map((a) => a.time);
    return TIME_SLOTS.filter((s) => !used.includes(s)).slice(0, 12);
  };

  const onConfirm = () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot) return;
    const apt = addAppointment({ patientId: selectedPatient, doctorId: selectedDoctor, date: TODAY_STR, time: selectedSlot, type: "Walk-in", duration: 15 });
    const tok = checkInAppointment(apt.id);
    setToken(tok); toast.success(`Checked in · Token #${tok}`); setStep(4);
  };

  if (!open) return null;

  const selectedPat = patients.find((p) => p.id === selectedPatient);
  const selectedDoc = doctors.find((d) => d.id === selectedDoctor);
  const consultFee = getConsultFee(selectedDoctor || "");

  return createPortal(
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(5,10,15,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <div
        className="w-full max-w-[480px] rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "90dvh",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          background: "#fff",
        }}
      >
        {/* ────── Gradient header ────── */}
        <div
          className="px-6 pt-6 pb-5 shrink-0"
          style={{
            background: step === 4
              ? "linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 60%, #1E7A45 100%)"
              : "linear-gradient(135deg, #0E3D29 0%, #1A5C3A 50%, #226B44 100%)",
          }}
        >
          {/* Title row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {step === 4 ? (
                  <Ticket className="h-5 w-5 text-white" />
                ) : (
                  <Zap className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Walk-in · Fast track
                </p>
                <h2 className="text-[17px] font-bold text-white leading-snug mt-0.5">
                  {step <= 3 ? "Check-in a patient" : "Check-in complete"}
                </h2>
              </div>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-all mt-0.5 shrink-0"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper */}
          {step <= 3 && <HeaderStepper current={step} />}
        </div>

        {/* ────── Scrollable content ────── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#F8F9FA" }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="p-5 space-y-4">
              {/* Pill tab switcher */}
              <div
                className="flex p-1 rounded-2xl"
                style={{ background: "#EBEBEA" }}
              >
                {(["search", "register"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="flex-1 py-2.5 text-[12.5px] font-semibold rounded-xl transition-all"
                    style={{
                      background: mode === m ? "#fff" : "transparent",
                      color: mode === m ? "#111" : "#888",
                      boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {m === "search" ? "🔍  Search Existing" : "✚  Register New"}
                  </button>
                ))}
              </div>

              {mode === "search" ? (
                <div className="space-y-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9CA3AF" }} />
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Name, MRN or phone number…"
                      className="w-full h-11 pl-11 pr-4 rounded-xl text-[13px] text-gray-800 outline-none transition-all"
                      style={{
                        background: "#fff",
                        border: "1.5px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#2C7A5B")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>

                  {/* Patient rows */}
                  <div className="space-y-2">
                    {matches.map((p) => (
                      <PatientRow
                        key={p.id}
                        name={p.name}
                        id={p.id}
                        phone={p.phone}
                        onSelect={() => { setSelectedPatient(p.id); setStep(2); }}
                      />
                    ))}
                    {matches.length === 0 && q && (
                      <div className="py-8 text-center">
                        <div className="text-[13px] text-gray-400">No patients found for <span className="font-medium text-gray-600">"{q}"</span></div>
                        <button
                          onClick={() => setMode("register")}
                          className="mt-2 text-[12.5px] font-semibold underline"
                          style={{ color: "#2C7A5B" }}
                        >
                          Register as new patient →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Quick register form */
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "#fff", border: "1.5px solid #E8F3EE" }}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" style={{ color: "#2C7A5B" }} />
                    <span className="text-[13px] font-bold text-gray-800">New Patient Details</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Full Name", key: "name", placeholder: "e.g. Ravi Kumar", type: "text" },
                      { label: "Phone", key: "phone", placeholder: "+91 9XXXXXXXXX", type: "tel" },
                      { label: "Date of Birth", key: "dob", placeholder: "YYYY-MM-DD", type: "text" },
                    ].map(({ label, key, placeholder, type }) => (
                      <div key={key} className={key === "dob" ? "col-span-1" : ""}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={quick[key as keyof typeof quick]}
                          onChange={(e) => setQuick({ ...quick, [key]: e.target.value })}
                          className="w-full h-10 px-3.5 rounded-xl text-[12.5px] text-gray-800 outline-none transition-all"
                          style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
                          onFocus={(e) => (e.target.style.borderColor = "#2C7A5B")}
                          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Gender</label>
                      <select
                        value={quick.gender}
                        onChange={(e) => setQuick({ ...quick, gender: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl text-[12.5px] text-gray-800 outline-none transition-all"
                        style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={onQuickRegister}
                    className="w-full h-11 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: "linear-gradient(135deg, #1A5C3A, #226B44)" }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Register & Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              {/* Selected patient mini-card */}
              {selectedPat && (() => {
                const pal = getAvatarPalette(selectedPat.name);
                return (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "#EEF8F3", border: "1.5px solid #C5E9D8" }}
                  >
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-[12px] shrink-0"
                      style={{ background: "#2C7A5B", color: "#fff" }}
                    >
                      {getInitials(selectedPat.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-gray-900">{selectedPat.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{selectedPat.id}</div>
                    </div>
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" style={{ color: "#2C7A5B" }} />
                  </div>
                );
              })()}

              {/* Doctor selection */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">On-Duty Doctors</span>
                </div>
                <div className="space-y-2">
                  {doctors.filter((d) => d.onDuty).map((d) => (
                    <DoctorOption
                      key={d.id}
                      doctor={d}
                      fee={getConsultFee(d.id)}
                      selected={selectedDoctor === d.id}
                      onSelect={() => { setSelectedDoctor(d.id); setSelectedSlot(null); }}
                    />
                  ))}
                </div>
              </div>

              {/* Slot grid */}
              {selectedDoctor && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Slots — Today</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlotsFor(selectedDoctor).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className="h-10 rounded-xl text-[12px] font-semibold font-mono transition-all"
                        style={{
                          background: selectedSlot === s ? "#1A5C3A" : "#fff",
                          color: selectedSlot === s ? "#fff" : "#374151",
                          border: `1.5px solid ${selectedSlot === s ? "#1A5C3A" : "#E5E7EB"}`,
                          boxShadow: selectedSlot === s ? "0 2px 8px rgba(26,92,58,0.3)" : "none",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="p-5 space-y-4">
              <p className="text-[12.5px] text-gray-500">Review the appointment before confirming.</p>
              <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
                {selectedPat && (
                  <DetailRow
                    icon={<div className="h-5 w-5 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: "#2C7A5B", color: "#fff" }}>{getInitials(selectedPat.name)}</div>}
                    label="Patient"
                    value={selectedPat.name}
                    sub={selectedPat.id}
                  />
                )}
                {selectedDoc && (
                  <DetailRow
                    icon={<Stethoscope className="h-4 w-4 text-gray-500" />}
                    label="Doctor"
                    value={selectedDoc.name}
                    sub={`Room ${selectedDoc.room}`}
                  />
                )}
                <DetailRow
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                  label="Appointment Time"
                  value={selectedSlot ?? "—"}
                  sub="Today"
                />
                <DetailRow
                  icon={<IndianRupee className="h-4 w-4" style={{ color: "#1a7a1a" }} />}
                  label="Consultation Fee"
                  value={`₹${consultFee}`}
                  sub="Pay at billing"
                />
              </div>

              {/* Info notice */}
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-2xl text-[12px]"
                style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", color: "#92400E" }}
              >
                <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" />
                Token issued immediately. Direct patient to the waiting area.
              </div>
            </div>
          )}

          {/* ── STEP 4 — Success ── */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center p-8 gap-5">
              {/* Token hero */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Queue Token</p>
                <div
                  className="text-[96px] font-black leading-none tabular-nums"
                  style={{
                    background: "linear-gradient(135deg, #0E3D29, #2C7A5B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  #{token}
                </div>
              </div>

              {/* Patient info pill */}
              {selectedPat && (
                <div
                  className="rounded-2xl px-6 py-4 w-full max-w-xs space-y-1"
                  style={{ background: "#F0FAF5", border: "1.5px solid #C5E9D8" }}
                >
                  <div className="font-bold text-[15px] text-gray-900">{selectedPat.name}</div>
                  {selectedDoc && (
                    <div className="text-[12px]" style={{ color: "#2C7A5B" }}>
                      {selectedDoc.name} · {selectedSlot}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[12.5px] text-gray-400 max-w-[220px] leading-relaxed">
                Please direct the patient to the waiting area — the doctor board is updated.
              </p>
            </div>
          )}
        </div>

        {/* ────── Footer actions ────── */}
        <div
          className="shrink-0 px-5 py-4 flex items-center gap-3"
          style={{ borderTop: "1px solid #F0F0EE", background: "#fff" }}
        >
          {step === 1 && (
            <button
              onClick={() => { reset(); onClose(); }}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: "#F3F4F6", color: "#374151" }}
            >
              Cancel
            </button>
          )}

          {(step === 2 || step === 3) && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-all"
              style={{ background: "#F3F4F6", color: "#374151" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}

          {step === 2 && (
            <button
              disabled={!selectedDoctor || !selectedSlot}
              onClick={() => setStep(3)}
              className="ml-auto h-10 px-6 rounded-xl text-[13px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #1A5C3A, #226B44)" }}
            >
              Review
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={onConfirm}
              className="ml-auto h-10 px-6 rounded-xl text-[13px] font-bold text-white flex items-center gap-2 transition-all"
              style={{ background: "linear-gradient(135deg, #1A5C3A, #226B44)", boxShadow: "0 4px 16px rgba(26,92,58,0.35)" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Check-in
            </button>
          )}

          {step === 4 && (
            <button
              onClick={() => { reset(); onClose(); }}
              className="w-full h-11 rounded-xl text-[13px] font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #1A5C3A, #226B44)", boxShadow: "0 4px 16px rgba(26,92,58,0.35)" }}
            >
              Done — Close
            </button>
          )}
        </div>
      </div>
    </div>
  , document.body);
}

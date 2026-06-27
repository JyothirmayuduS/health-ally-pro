import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR, TIME_SLOTS } from "@/lib/reception-desk/mockData";
import { X, Search, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  const [q, setQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [quick, setQuick] = useState({ name: "", phone: "", dob: "", gender: "Male" });

  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [token, setToken] = useState<number | null>(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients.slice(0, 6);
    return patients.filter((p) => {
      return (
        p.name.toLowerCase().includes(s) ||
        (p.phone || "").includes(s) ||
        p.id.toLowerCase().includes(s)
      );
    });
  }, [q, patients]);

  const onQuickRegister = () => {
    if (!quick.name || !quick.phone) return toast.error("Provide name and phone");
    const p = addPatient({
      name: quick.name,
      phone: quick.phone,
      dob: quick.dob || null,
      gender: quick.gender,
    });
    setSelectedPatient(p.id);
    toast.success("Patient registered");
    setStep(2);
  };

  const onSelectDoctor = (id: string) => {
    setSelectedDoctor(id);
    setSelectedSlot(null);
  };

  const availableSlotsFor = (docId: string) => {
    const used = appointments
      .filter((a) => a.date === TODAY_STR && a.doctorId === docId && a.status !== "cancelled")
      .map((a) => a.time);
    return TIME_SLOTS.filter((s) => !used.includes(s)).slice(0, 12);
  };

  const onConfirm = () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot) return;
    const apt = addAppointment({
      patientId: selectedPatient,
      doctorId: selectedDoctor,
      date: TODAY_STR,
      time: selectedSlot,
      type: "Walk-in",
      duration: 15,
    });
    const tok = checkInAppointment(apt.id);
    setToken(tok);
    toast.success(`Checked in · Token #${tok}`);
    setStep(4);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-sm border border-ink-200">
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Walk-in — Fast track
            </div>
            <h3 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              {step <= 3 ? `Step ${step} of 3` : "Success"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div>
              <div className="mb-3 text-[12px] text-ink-600">
                Search patient by name, MRN or phone
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-[13px] bg-bone border border-ink-200 rounded-sm"
                  placeholder="Search or type new patient name..."
                />
              </div>
              <div className="grid gap-2">
                {matches.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p.id);
                      setStep(2);
                    }}
                    className="text-left px-3 py-2 rounded-sm hover:bg-bone"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink-900">{p.name}</div>
                        <div className="text-[12px] text-ink-400">
                          {p.id} · {p.phone}
                        </div>
                      </div>
                      <div className="text-[12px] text-ink-600">Select</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="text-[12px] font-medium text-ink-900 mb-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sage" /> Quick register
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Name"
                    value={quick.name}
                    onChange={(e) => setQuick({ ...quick, name: e.target.value })}
                    className="h-9 px-2 border rounded-sm"
                  />
                  <input
                    placeholder="Phone"
                    value={quick.phone}
                    onChange={(e) => setQuick({ ...quick, phone: e.target.value })}
                    className="h-9 px-2 border rounded-sm"
                  />
                  <input
                    placeholder="DOB (YYYY-MM-DD)"
                    value={quick.dob}
                    onChange={(e) => setQuick({ ...quick, dob: e.target.value })}
                    className="h-9 px-2 border rounded-sm"
                  />
                  <select
                    value={quick.gender}
                    onChange={(e) => setQuick({ ...quick, gender: e.target.value })}
                    className="h-9 px-2 border rounded-sm"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={onQuickRegister} className="btn-money">
                    Register & continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-3 text-[12px] text-ink-600">Choose doctor and time slot</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase text-ink-400 mb-2">On-duty doctors</div>
                  <ul className="space-y-2">
                    {doctors
                      .filter((d) => d.onDuty)
                      .map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => onSelectDoctor(d.id)}
                            className={`w-full text-left px-3 py-2 rounded-sm ${selectedDoctor === d.id ? "bg-sage-soft" : "hover:bg-bone"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-ink-900">{d.name}</div>
                                <div className="text-[12px] text-ink-400">
                                  {d.specialty} · Room {d.room}
                                </div>
                              </div>
                              <div className="text-[12px] text-ink-600">
                                {getConsultFee(d.id) ? `₹${getConsultFee(d.id)}` : ""}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-ink-400 mb-2">
                    Available slots — today
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedDoctor
                      ? availableSlotsFor(selectedDoctor)
                      : TIME_SLOTS.slice(0, 12)
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`h-9 rounded-sm ${selectedSlot === s ? "bg-sage text-white" : "bg-white border border-ink-200 hover:bg-bone"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(1)} className="btn-outline">
                  Back
                </button>
                <div className="ml-auto">
                  <button
                    disabled={!selectedDoctor || !selectedSlot}
                    onClick={() => setStep(3)}
                    className="btn-money"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-3 text-[12px] text-ink-600">Confirm & check-in</div>
              <div className="border rounded-sm p-4">
                <div className="text-[13px] font-medium">Patient</div>
                <div className="text-ink-900 mt-1">
                  {patients.find((p) => p.id === selectedPatient)?.name}
                </div>
                <div className="mt-3 text-[13px] font-medium">Doctor / slot</div>
                <div className="text-ink-900 mt-1">
                  {doctors.find((d) => d.id === selectedDoctor)?.name} · {selectedSlot}
                </div>
                <div className="mt-3 text-[13px] font-medium">Consult fee</div>
                <div className="text-ink-900 mt-1">₹{getConsultFee(selectedDoctor || "")}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(2)} className="btn-outline">
                  Back
                </button>
                <div className="ml-auto">
                  <button onClick={onConfirm} className="btn-money">
                    Confirm & Check-in
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="text-[11px] uppercase text-ink-400">Checked in</div>
              <div className="text-[64px] font-heading font-semibold text-sage mt-2">#{token}</div>
              <div className="mt-3 text-ink-900">Please direct patient to the waiting area</div>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setToken(null);
                    onClose();
                    setStep(1);
                  }}
                  className="btn-money"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

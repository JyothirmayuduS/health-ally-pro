import React, { useState, useMemo, useEffect } from "react";
import { X, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR, TIME_SLOTS } from "@/lib/reception-desk/mockData";

const REASONS = [
  "Patient request",
  "Doctor unavailable",
  "Emergency",
  "Duplicate booking",
  "No show confirmed",
  "Other",
];

export default function CancelAppointmentModal({ open, onClose, appointment, onConfirm }) {
  const { doctors, appointments } = useStore();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reschedule, setReschedule] = useState(false);

  // Reschedule fields
  const [reschDate, setReschDate] = useState(TODAY_STR);
  const [reschDoctorId, setReschDoctorId] = useState("");
  const [reschSlot, setReschSlot] = useState("");

  useEffect(() => {
    if (appointment) {
      setReschDoctorId(appointment.doctorId);
    }
  }, [appointment]);

  const availableSlotsFor = useMemo(() => {
    if (!reschDoctorId) return [];
    const used = appointments
      .filter((a) => a.date === reschDate && a.doctorId === reschDoctorId && a.status !== "cancelled")
      .map((a) => a.time);
    return TIME_SLOTS.filter((s) => !used.includes(s));
  }, [reschDoctorId, reschDate, appointments]);

  if (!open || !appointment) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const rescheduleObj = reschedule
      ? {
          doctorId: reschDoctorId,
          date: reschDate,
          time: reschSlot,
        }
      : undefined;

    onConfirm(appointment.id, reason, notes, rescheduleObj);
  };

  const isRescheduleValid = !reschedule || (reschDoctorId && reschDate && reschSlot);
  const isValid = reason && isRescheduleValid;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-sm border border-ink-200 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Cancel Appointment
            </div>
            <h3 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Ref: {appointment.id}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="p-5 space-y-4">
            {/* Warning Banner */}
            <div className="p-3 bg-clay-soft/40 border border-clay/20 rounded-sm text-[12.5px] text-clay flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Are you sure?</span> This will cancel the booking. If you select Reschedule, it will automatically cancel this slot and book a new one.
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Reason for Cancellation <span className="text-status-noshowText">*</span>
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-2 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage text-ink-900"
              >
                <option value="" disabled>Select reason...</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details or patient comments..."
                rows={2}
                className="w-full p-2 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage text-ink-900 resize-none"
              />
            </div>

            {/* Reschedule Toggle */}
            <div className="flex items-center justify-between border-t border-ink-100 pt-3">
              <div>
                <div className="text-[13px] font-medium text-ink-900">Offer reschedule?</div>
                <div className="text-[11.5px] text-ink-400">Cancel the current slot and immediately schedule a new time.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reschedule}
                  onChange={(e) => {
                    setReschedule(e.target.checked);
                    if (e.target.checked) setReschSlot("");
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage"></div>
              </label>
            </div>

            {/* Reschedule Details */}
            {reschedule && (
              <div className="p-4 bg-bone border border-ink-200 rounded-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-ink-600 mb-1">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={reschDate}
                      onChange={(e) => {
                        setReschDate(e.target.value);
                        setReschSlot("");
                      }}
                      className="w-full h-8 px-2 text-[12.5px] bg-white border border-ink-200 rounded-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-ink-600 mb-1">
                      Doctor
                    </label>
                    <select
                      value={reschDoctorId}
                      onChange={(e) => {
                        setReschDoctorId(e.target.value);
                        setReschSlot("");
                      }}
                      className="w-full h-8 px-1.5 text-[12.5px] bg-white border border-ink-200 rounded-sm focus:outline-none"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-ink-600 mb-1">
                    Available slots
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {availableSlotsFor.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setReschSlot(slot)}
                        className={`h-7 text-[11.5px] font-mono rounded-sm border ${
                          reschSlot === slot
                            ? "bg-sage border-sage text-white font-medium"
                            : "bg-white border-ink-200 hover:border-sage text-ink-700"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                    {availableSlotsFor.length === 0 && (
                      <div className="col-span-4 text-center text-[12px] text-ink-400 py-2">
                        No slots available on this date.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-ink-200 flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Go back
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-clay flex-1 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" /> Confirm Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

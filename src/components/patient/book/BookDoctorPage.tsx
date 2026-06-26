import { Link } from "@tanstack/react-router";
import {
  Activity,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pill,
  Star,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BOOK_DAYS,
  VISIT_TYPES,
  doctorFeeRangeInr,
  getPastMedsByDoctor,
} from "@/lib/book-utils";
import { PROFILE_STORE_EVENT } from "@/lib/doctor-profile-store";
import { doctors } from "@/lib/mock-data";
import {
  BookingConfirmationScreen,
  type BookingConfirmationData,
} from "@/components/patient/book/BookingConfirmationScreen";
import {
  PATIENT_BOOKING_EVENT,
  dateKeyForDayIndex,
  getBookableSlots,
  hasBookingForDoctorDay,
  savePatientBooking,
  slotStatusDetail,
  type BookableSlot,
} from "@/lib/patient-booking-store";
import { upsertAppointmentFromBooking } from "@/lib/patient-appointments-store";
import { cn } from "@/lib/utils";

export function BookDoctorPage({ doctorId }: { doctorId: string }) {
  const doctor = doctors.find((d) => d.id === doctorId);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<(typeof VISIT_TYPES)[number]["id"]>("in_person");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmationData | null>(null);
  const [slotVersion, setSlotVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setSlotVersion((v) => v + 1);
    window.addEventListener(PATIENT_BOOKING_EVENT, refresh);
    window.addEventListener(PROFILE_STORE_EVENT, refresh);
    return () => {
      window.removeEventListener(PATIENT_BOOKING_EVENT, refresh);
      window.removeEventListener(PROFILE_STORE_EVENT, refresh);
    };
  }, []);

  const bookableSlots = useMemo(
    () => getBookableSlots(doctorId, selectedDay),
    [doctorId, selectedDay, slotVersion],
  );

  const pastMeds = useMemo(
    () => (doctor ? getPastMedsByDoctor(doctor.name) : []),
    [doctor],
  );

  const selectedSlotMeta = bookableSlots.find((s) => s.time === selectedSlot);
  const feeRange = doctor ? doctorFeeRangeInr(doctor) : { min: 800, max: 900 };
  const totalInr = selectedSlotMeta?.price ?? feeRange.min;

  useEffect(() => {
    if (!selectedSlot) return;
    const current = bookableSlots.find((s) => s.time === selectedSlot);
    if (!current?.selectable) setSelectedSlot(null);
  }, [bookableSlots, selectedSlot]);

  if (!doctor) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Doctor not found.</p>
        <Link to="/book" className="mt-4 inline-block text-clay">
          Back
        </Link>
      </div>
    );
  }

  const confirmBooking = () => {
    if (!selectedSlot || !selectedSlotMeta?.selectable) return;
    const dateKey = dateKeyForDayIndex(selectedDay);
    if (hasBookingForDoctorDay(doctorId, dateKey)) {
      toast.error("Already booked", {
        description: "You already have an appointment with this doctor on that day.",
      });
      return;
    }
    const booking = savePatientBooking({
      doctorId,
      dateKey,
      time: selectedSlot,
      visitType,
      reason: reason.trim() || undefined,
    });
    if (!booking) {
      toast.error("Could not book", {
        description: "That slot is no longer available. Pick another time.",
      });
      setSlotVersion((v) => v + 1);
      setSelectedSlot(null);
      return;
    }
    upsertAppointmentFromBooking(booking, { reason, visitType });
    const visitDate = BOOK_DAYS[selectedDay] ?? new Date();
    setConfirmation({
      bookingId: booking.id,
      doctor,
      visitDate,
      slot: selectedSlotMeta,
      slotTime: selectedSlotMeta?.displayTime
        ? `${selectedSlotMeta.displayTime} ${selectedSlotMeta.period}`
        : selectedSlot,
      visitType,
      reason,
      totalInr,
      isToday: selectedDay === 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (confirmation) {
    return <BookingConfirmationScreen data={confirmation} />;
  }

  const visitIcons = {
    in_person: Briefcase,
    video: Video,
    follow_up: Activity,
  };

  const amSlots = bookableSlots.filter((s) => s.period === "AM");
  const pmSlots = bookableSlots.filter((s) => s.period === "PM");

  return (
    <div className="relative -mx-5 w-[calc(100%+2.5rem)] sm:mx-0 sm:w-full lg:mx-0">
      <header className="mb-5 flex items-center gap-3 px-5 sm:px-0">
        <Link
          to="/book"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
        </Link>
        <h1 className="flex-1 text-center font-semibold text-ink sm:text-left">
          Book Appointment
        </h1>
        <span className="w-11 shrink-0" aria-hidden />
      </header>

      <div className="space-y-8 px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-0 lg:grid lg:grid-cols-[minmax(300px,38%)_1fr] lg:items-start lg:gap-8 lg:pb-12">
        <div className="overflow-hidden rounded-[24px] bg-ink p-5 text-white lg:sticky lg:top-8">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/15 font-serif text-2xl">
              {doctor.initials}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                {doctor.specialty}
              </p>
              <p className="font-serif text-2xl leading-tight">{doctor.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-white/50">{doctor.bio}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Star, value: String(doctor.rating), label: "Rating", fill: true },
              { icon: Calendar, value: `${doctor.experience}y`, label: "Experience", fill: false },
              { icon: MapPin, value: doctor.hospital.split(" ")[0], label: "Hospital", fill: false },
            ].map(({ icon: Icon, value, label, fill }) => (
              <div
                key={label}
                className="rounded-xl bg-white/10 px-2 py-2.5 text-center"
              >
                <Icon
                  className="mx-auto h-3.5 w-3.5 text-clay"
                  fill={fill ? "currentColor" : "none"}
                  strokeWidth={1.75}
                />
                <p className="mt-1 text-sm font-semibold">{value}</p>
                <p className="text-[10px] text-white/40">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 text-sm">
            <span className="text-white/45">Fees vary by time slot </span>
            <span className="font-serif text-lg">
              ₹{feeRange.min} – ₹{feeRange.max}
            </span>
            <span className="text-white/45"> · Room 3A</span>
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          {pastMeds.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-serif text-lg text-ink">Clinical History</h2>
                <Link
                  to="/prescriptions"
                  search={{ doctor: doctor.name }}
                  className="text-[13px] font-semibold text-clay"
                >
                  View all history →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pastMeds.slice(0, 2).map((rx) => (
                  <div
                    key={rx.id}
                    className="flex gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/10">
                      <Pill className="h-4 w-4 text-clay" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{rx.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                        {rx.clinicalReason ?? rx.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-serif text-lg text-ink">Visit type</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {VISIT_TYPES.map(({ id, label }) => {
                const Icon = visitIcons[id];
                const active = visitType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVisitType(id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 text-[13px] font-medium",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-[#EDEAE6] bg-white text-ink-muted",
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-lg text-ink">Select date</h2>
            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none">
              {BOOK_DAYS.map((d, i) => {
                const sel = selectedDay === i;
                const dayKey = dateKeyForDayIndex(i);
                const dayTaken = hasBookingForDoctorDay(doctorId, dayKey);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={dayTaken}
                    onClick={() => {
                      if (dayTaken) return;
                      setSelectedDay(i);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      "relative flex min-w-[72px] shrink-0 flex-col items-center rounded-2xl border px-3 py-3",
                      dayTaken && "cursor-not-allowed opacity-40",
                      sel
                        ? "border-ink bg-ink text-white"
                        : "border-[#EDEAE6] bg-white text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        sel ? "text-white/60" : "text-ink-muted",
                      )}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="font-serif text-2xl tabular-nums">{d.getDate()}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase",
                        sel ? "text-white/50" : "text-ink-muted",
                      )}
                    >
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    {i === 0 ? (
                      <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-clay" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-lg text-ink">Available times</h2>
            {amSlots.length > 0 ? (
              <>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Morning
                </p>
                <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {amSlots.map((slot) => (
                    <SlotTile
                      key={slot.time}
                      slot={slot}
                      selected={selectedSlot === slot.time}
                      onSelect={() => slot.selectable && setSelectedSlot(slot.time)}
                    />
                  ))}
                </div>
              </>
            ) : null}
            {pmSlots.length > 0 ? (
              <>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Afternoon
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {pmSlots.map((slot) => (
                    <SlotTile
                      key={slot.time}
                      slot={slot}
                      selected={selectedSlot === slot.time}
                      onSelect={() => slot.selectable && setSelectedSlot(slot.time)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-lg text-ink">Reason for visit</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Briefly describe what you'd like to discuss…"
              className="w-full resize-none rounded-2xl border border-[#EDEAE6] bg-white p-4 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </section>

          <div className="hidden items-center justify-between gap-4 border-t border-[#EDEAE6] pt-6 lg:flex">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Total</p>
              <p className="font-serif text-2xl text-ink">
                {selectedSlot ? `₹${totalInr}` : `From ₹${feeRange.min}`}
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={confirmBooking}
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-[15px] font-semibold text-white disabled:opacity-35"
            >
              Confirm appointment
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EDEAE6] bg-[#F9F7F2]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Total</p>
            <p className="font-serif text-2xl text-ink">
              {selectedSlot ? `₹${totalInr}` : `From ₹${feeRange.min}`}
            </p>
          </div>
          <button
            type="button"
            disabled={!selectedSlot}
            onClick={confirmBooking}
            className="inline-flex max-w-[220px] flex-1 items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-35"
          >
            Confirm appointment
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotTile({
  slot,
  selected,
  onSelect,
}: {
  slot: BookableSlot;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = !slot.selectable;
  const statusDetail = slotStatusDetail(slot);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      title={statusDetail ?? undefined}
      className={cn(
        "rounded-2xl border px-3 py-3 text-left transition-colors",
        disabled && "opacity-40",
        selected ? "border-ink bg-ink text-white" : "border-[#EDEAE6] bg-white text-ink",
      )}
    >
      <p className="font-serif text-xl tabular-nums">{slot.displayTime}</p>
      <p
        className={cn(
          "mt-0.5 text-xs leading-snug",
          selected ? "text-white/65" : "text-ink-muted",
        )}
      >
        {slot.period} ₹{slot.price}
        {statusDetail ? ` · ${statusDetail}` : ""}
      </p>
    </button>
  );
}

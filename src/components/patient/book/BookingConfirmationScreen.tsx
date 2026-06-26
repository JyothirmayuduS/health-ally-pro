import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { BookingSuccessAnimation } from "@/components/patient/book/BookingSuccessAnimation";
import { VISIT_TYPES } from "@/lib/book-utils";
import type { Doctor } from "@/lib/mock-data";
import type { BookableSlot } from "@/lib/patient-booking-store";
import { cn } from "@/lib/utils";

export type BookingConfirmationData = {
  bookingId: string;
  doctor: Doctor;
  visitDate: Date;
  slot: BookableSlot | undefined;
  slotTime: string;
  visitType: (typeof VISIT_TYPES)[number]["id"];
  reason: string;
  totalInr: number;
  isToday: boolean;
};

function visitTypeLabel(id: BookingConfirmationData["visitType"]) {
  return VISIT_TYPES.find((v) => v.id === id)?.label ?? "In Person";
}

function roomForDoctor(doctor: Doctor) {
  if (doctor.specialty === "Dermatology") return "Derm Suite 4B";
  if (doctor.specialty === "Cardiology") return "Cardiology Wing · Room 2C";
  return "Outpatient · Room 3A";
}

function formatTimeLabel(data: BookingConfirmationData) {
  const slot = data.slot;
  if (slot?.displayTime) {
    return `${slot.displayTime} ${slot.period}`;
  }
  return data.slotTime;
}

function confirmationRef(bookingId: string) {
  return bookingId.replace("pb-", "MED-APT-").toUpperCase();
}

export function BookingConfirmationScreen({ data }: { data: BookingConfirmationData }) {
  const dateLong = data.visitDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = formatTimeLabel(data);
  const ref = confirmationRef(data.bookingId);
  const visitLabel = visitTypeLabel(data.visitType);
  const room = roomForDoctor(data.doctor);

  return (
    <div className="booking-confirm-screen mx-auto w-full max-w-lg px-1 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:max-w-xl sm:pt-8 lg:max-w-2xl lg:pb-12">
      <div className="animate-fade-in text-center">
        <BookingSuccessAnimation />
        <p className="booking-confirm-eyebrow mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[#2D6B4F]">
          Appointment confirmed
        </p>
        <h1 className="mt-2 font-serif text-[28px] leading-tight text-ink sm:text-[34px]">
          You&apos;re booked with {data.doctor.name}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{dateLong}</span> at{" "}
          <span className="font-medium text-ink">{timeLabel}</span>
          {" · "}
          {visitLabel} at {room}
        </p>
      </div>

      <article
        className="animate-fade-up booking-confirm-ticket mt-8 overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white shadow-[0_16px_48px_-20px_rgba(27,59,46,0.18)] sm:rounded-[28px]"
        style={{ animationDelay: "120ms" }}
      >
        <div className="border-b border-[#EDEAE6] bg-gradient-to-r from-[#F9F7F2] to-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                Confirmation
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
                {ref}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F3EE] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2D6B4F]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Secured
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#1B3B2E] font-serif text-lg text-white">
              {data.doctor.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{data.doctor.name}</p>
              <p className="text-sm text-ink-muted">{data.doctor.specialty}</p>
              <p className="mt-1 text-sm text-ink-muted">{data.doctor.hospital}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Date", value: dateLong.split(",")[0] ?? dateLong },
              { label: "Time", value: timeLabel },
              { label: "Visit", value: visitLabel },
              { label: "Fee", value: `₹${data.totalInr}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-[#F9F7F2] px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#EDEAE6] bg-[#FAFAF8] px-3.5 py-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6B4F]" strokeWidth={1.75} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Location
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">{room}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Arrive 10 minutes early for check-in and vitals
              </p>
            </div>
          </div>

          {data.reason.trim() ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#EDEAE6] px-3.5 py-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                  Reason noted
                </p>
                <p className="mt-0.5 text-sm text-ink">{data.reason.trim()}</p>
              </div>
            </div>
          ) : null}
        </div>
      </article>

      <section
        className="animate-fade-up mt-6 rounded-[22px] border border-[#EDEAE6] bg-white p-5 sm:p-6"
        style={{ animationDelay: "220ms" }}
      >
        <h2 className="font-serif text-lg text-ink">What happens next</h2>
        <ol className="mt-4 space-y-4">
          {[
            {
              icon: Bell,
              title: "Reminder sent",
              detail: "SMS & email 24 hours before your visit",
            },
            {
              icon: CalendarClock,
              title: data.isToday ? "Check in today" : "Check in on visit day",
              detail: data.isToday
                ? "Open live queue when you arrive at the clinic"
                : "You'll receive a check-in link on the morning of your appointment",
            },
            {
              icon: Stethoscope,
              title: "Consultation",
              detail: `${data.doctor.name} will review your chart before you enter the room`,
            },
          ].map(({ icon: Icon, title, detail }, i) => (
            <li key={title} className="flex gap-3">
              <span className="relative flex flex-col items-center">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E8F3EE] text-[#2D6B4F]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {i < 2 ? (
                  <span className="mt-1 h-full w-px flex-1 bg-[#EDEAE6]" aria-hidden />
                ) : null}
              </span>
              <div className="pb-1 pt-0.5">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div
        className="animate-fade-up mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap"
        style={{ animationDelay: "320ms" }}
      >
        {data.isToday ? (
          <Link
            to="/queue"
            search={{ doctor: data.doctor.id }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5",
              "text-[15px] font-semibold text-white transition-opacity hover:opacity-90",
            )}
          >
            Track queue
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        ) : (
          <Link
            to="/care/visits"
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5",
              "text-[15px] font-semibold text-white transition-opacity hover:opacity-90",
            )}
          >
            View appointment
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        )}
        <Link
          to="/"
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#EDEAE6] bg-white px-5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-[#F9F7F2]"
        >
          Back to dashboard
        </Link>
        <Link
          to="/book"
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#EDEAE6] bg-white px-5 py-3.5 text-[15px] font-semibold text-[#A67C66] transition-colors hover:bg-[#F9F7F2] sm:basis-full lg:basis-auto"
        >
          Book another visit
        </Link>
      </div>
    </div>
  );
}

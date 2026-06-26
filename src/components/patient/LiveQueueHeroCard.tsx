import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Clock4,
  MapPin,
  Radio,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Appointment, Doctor } from "@/lib/mock-data";
import {
  formatAppointmentTime,
  formatQueueDate,
  getQueueBoardSummary,
} from "@/lib/patient-queue";
import { doctorGenderFor } from "@/lib/doctor-gender";
import { DOCTOR_QUEUE_IMAGES, DOCTOR_QUEUE_INVERT } from "@/lib/queue-persona-assets";
import { QueueBustAvatar } from "@/components/patient/QueueBustAvatar";
import { QueueProgress } from "@/components/patient/QueueProgress";
import { cn } from "@/lib/utils";

type Props = {
  appointment: Appointment;
  doctor: Doctor;
  to?: string | false;
  queueDoctorId?: string;
  className?: string;
};

export function LiveQueueHeroCard({
  appointment,
  doctor,
  to = "/queue",
  queueDoctorId,
  className,
}: Props) {
  const position = appointment.queuePosition ?? 3;
  const total = appointment.queueTotal ?? 6;

  const [waitMin, setWaitMin] = useState(appointment.estimatedWait ?? 12);
  useEffect(() => {
    setWaitMin(appointment.estimatedWait ?? 12);
  }, [appointment.estimatedWait]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWaitMin((w) => (w > 1 ? w - 1 : w));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const timeLabel = formatAppointmentTime(appointment.time);
  const dateLabel = formatQueueDate(appointment.date);
  const room = appointment.room ?? "Suite 4B";
  const checkIn = appointment.checkInStatus ?? "Checked in · Vitals complete";

  const body = (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] text-white lg:rounded-[28px]",
        "bg-gradient-to-br from-[#1B3B2E] via-[#1A3629] to-[#122A1F]",
        "shadow-[0_16px_40px_-14px_rgba(27,59,46,0.5)]",
        className,
      )}
    >
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A9B7E] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7A9B7E]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
              Live queue
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
            <Radio className="h-3 w-3 text-[#7A9B7E]" strokeWidth={2} />
            Live
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">
              Your position
            </p>
            <p className="mt-0.5 font-serif text-[2.5rem] leading-none tracking-tight tabular-nums sm:text-5xl">
              {String(position).padStart(2, "0")}
              <span className="ml-1 text-base font-sans font-normal text-white/40 sm:text-xl">
                / {String(total).padStart(2, "0")}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-white/55">
              {getQueueBoardSummary(position, total)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
              Est. wait
            </p>
            <p className="mt-0.5 font-serif text-2xl tabular-nums leading-none sm:text-3xl">
              ~{waitMin}m
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-2.5 sm:p-3">
          <QueueBustAvatar
            src={DOCTOR_QUEUE_IMAGES[doctorGenderFor(doctor)]}
            role="doctor"
            size="sm"
            invert={DOCTOR_QUEUE_INVERT}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{doctor.name}</p>
            <p className="truncate text-xs text-white/60">
              {doctor.specialty} · {doctor.hospital}
            </p>
          </div>
        </div>

        <QueueProgress
          className="mt-4"
          position={position}
          total={total}
          doctorName={doctor.name}
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          <MetaChip icon={CalendarDays} label={dateLabel} />
          <MetaChip icon={Clock4} label={timeLabel} />
          <MetaChip icon={MapPin} label={room} />
        </div>
        <p className="mt-2 text-[11px] text-[#7A9B7E]">{checkIn}</p>

        {to ? (
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
            <span className="text-sm font-medium text-white/85">View queue board</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );

  if (to) {
    return (
      <Link
        to={to}
        search={(queueDoctorId ?? doctor.id) ? { doctor: queueDoctorId ?? doctor.id } : undefined}
        className="block transition-transform active:scale-[0.99]"
      >
        {body}
      </Link>
    );
  }

  return body;
}

function MetaChip({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 sm:px-2.5 sm:py-1 sm:text-[11px]">
      <Icon className="h-3 w-3 opacity-70" strokeWidth={1.75} />
      {label}
    </span>
  );
}

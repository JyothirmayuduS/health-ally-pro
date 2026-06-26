import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronRight,
  Clock4,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  Stethoscope,
  Video,
} from "lucide-react";
import { useState } from "react";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import { CareContactActions } from "@/components/patient/CareContactActions";
import { PatientBackButton } from "@/components/patient/PatientBackButton";
import { ProfileCard, ProfileSectionTitle } from "@/components/patient/profile/profile-ui";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
  formatVisitDateLong,
  formatVisitDateShort,
} from "@/lib/patient-appointments-ui";
import type { Appointment, Doctor } from "@/lib/mock-data";
import { doctors as mockDoctors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = {
  visitId: string;
};

export function VisitDetailPage({ visitId }: Props) {
  const { appointments } = usePatientAppointments();
  const [doctors] = useState<Doctor[]>(mockDoctors);

  const appointment = appointments.find((a) => a.id === visitId);
  const doctor = appointment
    ? doctors.find((d) => d.id === appointment.doctorId)
    : undefined;

  if (!appointment || !doctor) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Visit not found.</p>
        <Link to="/care/visits" className="mt-4 inline-block text-clay">
          Back to visits
        </Link>
      </div>
    );
  }

  const isLive = appointment.status === "in-queue";
  const isUpcoming = appointment.status === "upcoming";
  const isCompleted = appointment.status === "completed";

  const detailRows = [
    { label: "Date", value: formatVisitDateLong(appointment.date) },
    { label: "Time", value: appointment.time },
    { label: "Reason for visit", value: appointment.reason },
    {
      label: "Location",
      value: appointment.room ?? `${doctor.hospital} · Outpatient`,
    },
    ...(appointment.checkInStatus
      ? [{ label: "Check-in", value: appointment.checkInStatus }]
      : []),
    ...(isLive && appointment.queuePosition
      ? [
          {
            label: "Queue position",
            value: `#${String(appointment.queuePosition).padStart(2, "0")} of ${appointment.queueTotal ?? "—"}`,
          },
        ]
      : []),
    ...(isLive && appointment.estimatedWait
      ? [{ label: "Estimated wait", value: `~${appointment.estimatedWait} minutes` }]
      : []),
    { label: "Provider", value: `${doctor.name} · ${doctor.specialty}` },
    { label: "Hospital", value: doctor.hospital },
  ];

  return (
    <div className="w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-12">
      <header className="mb-5 sm:mb-6">
        <div className="mb-4 flex items-start gap-3">
          <PatientBackButton
            fallbackTo="/care/visits"
            label="Visits"
            className="mt-1 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
              Visit details
            </p>
            <h1 className="truncate font-serif text-[26px] leading-tight text-ink sm:text-[32px]">
              {appointment.reason}
            </h1>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
              appointmentStatusColor(appointment.status),
            )}
          >
            {appointmentStatusLabel(appointment.status)}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          {doctor.name} · {formatVisitDateShort(appointment.date)} · {appointment.time}
        </p>
      </header>

      <ProfileCard className="mb-5 p-4 sm:mb-6 sm:p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-clay/15 font-serif text-lg text-ink">
            {doctor.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{doctor.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{doctor.specialty}</p>
            <p className="mt-1 text-sm text-ink-muted">{doctor.hospital}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CareContactActions doctorName={doctor.name} />
            </div>
          </div>
        </div>
      </ProfileCard>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3">
        {[
          { icon: CalendarClock, label: "Date", value: formatVisitDateShort(appointment.date) },
          { icon: Clock4, label: "Time", value: appointment.time },
          {
            icon: MapPin,
            label: "Location",
            value: appointment.room ?? "Outpatient",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-[18px] border border-[#EDEAE6] bg-white px-3 py-3 sm:rounded-[20px] sm:px-4 sm:py-4"
          >
            <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <section className="mb-5 sm:mb-6">
        <ProfileSectionTitle>Visit summary</ProfileSectionTitle>
        <ProfileCard>
          {detailRows.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "px-4 py-3.5 sm:px-5 sm:py-4",
                i > 0 && "border-t border-[#EDEAE6]",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                {row.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">{row.value}</p>
            </div>
          ))}
        </ProfileCard>
      </section>

      {isCompleted ? (
        <section className="mb-5 sm:mb-6">
          <ProfileSectionTitle>After your visit</ProfileSectionTitle>
          <ProfileCard>
            <Link
              to="/prescriptions"
              className="flex items-center gap-3 border-b border-[#EDEAE6] px-4 py-4 sm:px-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay/10">
                <Pill className="h-4 w-4 text-clay" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Prescriptions</p>
                <p className="text-xs text-ink-muted">Medications from this visit</p>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 px-4 py-4 sm:px-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F3F1EC]">
                <FileText className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Reports & labs</p>
                <p className="text-xs text-ink-muted">Results shared after consultation</p>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
          </ProfileCard>
        </section>
      ) : null}

      <section className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {isLive ? (
          <Link
            to="/queue"
            search={{ doctor: doctor.id }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white"
          >
            <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
            Open live queue
          </Link>
        ) : null}
        {isUpcoming ? (
          <Link
            to="/book/$doctorId"
            params={{ doctorId: doctor.id }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white"
          >
            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
            Manage booking
          </Link>
        ) : null}
        {isCompleted ? (
          <Link
            to="/book/$doctorId"
            params={{ doctorId: doctor.id }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white"
          >
            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
            Book follow-up
          </Link>
        ) : null}
      </section>
    </div>
  );
}

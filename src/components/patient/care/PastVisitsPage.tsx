import { Link } from "@tanstack/react-router";
import {
  CalendarPlus,
  ChevronRight,
  Clock4,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import { PatientBackIconButton } from "@/components/patient/PatientBackButton";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
  formatVisitDateShort,
} from "@/lib/patient-appointments-ui";
import type { Appointment, Doctor } from "@/lib/mock-data";
import { doctors as mockDoctors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = {
  doctorFilter?: string;
};

export function PastVisitsPage({ doctorFilter }: Props) {
  const { appointments } = usePatientAppointments();
  const [doctors] = useState<Doctor[]>(mockDoctors);

  const filtered = useMemo(() => {
    const list = doctorFilter
      ? appointments.filter((a) => a.doctorId === doctorFilter)
      : appointments;
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [appointments, doctorFilter]);

  const upcoming = filtered.filter(
    (a) => a.status === "upcoming" || a.status === "in-queue",
  );
  const past = filtered.filter((a) => a.status === "completed" || a.status === "cancelled");

  const filterDoctor = doctorFilter
    ? doctors.find((d) => d.id === doctorFilter)
    : undefined;

  const backFallback = doctorFilter ? "/" : "/care";

  return (
    <div className="w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-12">
      <header className="mb-5 sm:mb-6">
        <div className="mb-4 flex items-center gap-2">
          <PatientBackIconButton fallbackTo={backFallback} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
              Your visits
            </p>
            <h1 className="font-serif text-[28px] leading-tight text-ink sm:text-[32px]">
              Past visits
            </h1>
          </div>
          <Link
            to="/book"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white"
          >
            <CalendarPlus className="h-3.5 w-3.5" strokeWidth={2} />
            Book new
          </Link>
        </div>
        <p className="text-sm text-ink-muted">
          {filterDoctor
            ? `Visits with ${filterDoctor.name}`
            : "Upcoming appointments and your visit history with Medora."}
        </p>
        {filterDoctor ? (
          <Link
            to="/care/visits"
            className="mt-2 inline-block text-sm font-semibold text-[#A67C66]"
          >
            Show all visits
          </Link>
        ) : null}
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#D8D4CE] bg-white px-6 py-12 text-center">
          <p className="font-serif text-xl text-ink">No visits yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            When you book or complete appointments, they will appear here.
          </p>
          <Link
            to="/book"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Book your first visit
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8 lg:gap-10">
          {upcoming.length > 0 ? (
            <VisitSection title="Upcoming" appointments={upcoming} doctors={doctors} />
          ) : null}
          {past.length > 0 ? (
            <VisitSection title="Completed" appointments={past} doctors={doctors} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function VisitSection({
  title,
  appointments: items,
  doctors,
}: {
  title: string;
  appointments: Appointment[];
  doctors: Doctor[];
}) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-lg text-ink sm:mb-4 sm:text-xl">{title}</h2>
      <ul className="flex flex-col gap-3 sm:gap-4">
        {items.map((appt) => {
          const doc = doctors.find((d) => d.id === appt.doctorId);
          if (!doc) return null;
          return (
            <li key={appt.id}>
              <Link
                to="/care/visits/$visitId"
                params={{ visitId: appt.id }}
                className="block overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white transition-colors hover:border-[#E0DBD4] hover:bg-[#FDFBF9] active:bg-[#F9F7F2] sm:rounded-[22px]"
              >
                <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/15 font-serif text-sm text-ink sm:h-12 sm:w-12">
                    {doc.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{doc.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          appointmentStatusColor(appt.status),
                        )}
                      >
                        {appointmentStatusLabel(appt.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">{doc.specialty}</p>
                    <p className="mt-2 text-sm text-ink">{appt.reason}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock4 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {formatVisitDateShort(appt.date)} · {appt.time}
                      </span>
                      {appt.room ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {appt.room}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F3F1EC]">
                    <ChevronRight className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import {
  CalendarPlus,
  ChevronRight,
  Clock4,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LiveQueueHeroCard } from "@/components/patient/LiveQueueHeroCard";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";
import { DoctorListCard } from "@/components/patient/book/DoctorListCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import { doctors as mockDoctors } from "@/lib/mock-data";
import type { Doctor } from "@/lib/mock-data";
import { getLiveQueueContext } from "@/lib/patient-queue";
import { fetchDoctors } from "@/lib/supabase/queries";

function HubLinkCard({
  to,
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  to: "/book" | "/queue" | "/care/visits";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-[20px] border border-[#EDEAE6] bg-white p-4 transition-colors active:bg-[#F9F7F2] sm:rounded-[24px] sm:p-5"
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accent ?? "bg-[#F9F7F2]"}`}
      >
        <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
    </Link>
  );
}

export function CareHubPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { appointments } = usePatientAppointments();
  const doctorList = doctors.length ? doctors : mockDoctors;
  const live = getLiveQueueContext(doctorList);

  useEffect(() => {
    fetchDoctors()
      .then((d) => setDoctors(d.length ? d : mockDoctors))
      .finally(() => setLoading(false));
  }, []);

  const featured = doctors.slice(0, 2);

  return (
    <PatientHubLayout>
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          Get care
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-tight text-ink sm:text-[38px] lg:text-[40px]">
          Care
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Book visits, track your queue, and browse your care team.
        </p>
      </header>

      <Link
        to="/book"
        className="mb-5 flex items-center justify-between gap-4 rounded-[24px] bg-ink px-5 py-4 text-white shadow-[0_8px_24px_rgba(30,58,50,0.18)] sm:mb-6 sm:px-6 sm:py-5"
      >
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <CalendarPlus className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-semibold">Book appointment</p>
            <p className="mt-0.5 text-sm text-white/75">
              Search specialists · pick a time · confirm instantly
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-white/80" strokeWidth={1.75} />
      </Link>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
        <div className={live ? "lg:col-span-8" : "lg:col-span-12"}>
          {live ? (
            <LiveQueueHeroCard
              appointment={live.appointment}
              doctor={live.doctor}
              queueDoctorId={live.doctor.id}
            />
          ) : null}

          <ul
            className={cn(
              "flex flex-col gap-4 sm:gap-5",
              live && "mt-7 sm:mt-8 lg:mt-8",
            )}
          >
            <li>
              <HubLinkCard
                to="/care/visits"
                icon={CalendarPlus}
                title="Past visits"
                subtitle="View upcoming and completed appointments"
                accent="bg-ink/10"
              />
            </li>
            <li>
              <HubLinkCard
                to="/queue"
                icon={Clock4}
                title="Live queue"
                subtitle={
                  live
                    ? `Position ${live.appointment.queuePosition ?? "—"} · Est. wait ${live.appointment.estimatedWait ?? "—"} min · ${appointments.filter((a) => a.status === "in-queue").length} active`
                    : "No active visit — join when you check in"
                }
                accent="bg-clay/15"
              />
            </li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <ul className="flex flex-col gap-3">
            <li>
              <HubLinkCard
                to="/book"
                icon={Stethoscope}
                title="Find a specialist"
                subtitle="Browse board-certified doctors in the Medora network"
                accent="bg-[#E8F3EE]"
              />
            </li>
          </ul>
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-serif text-xl text-ink lg:mt-10 lg:text-2xl">
        Featured doctors
      </h2>
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-[20px]" />
          <Skeleton className="h-28 w-full rounded-[20px]" />
        </div>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-2">
          {featured.map((d) => (
            <DoctorListCard key={d.id} doctor={d} />
          ))}
          <Link
            to="/book"
            className="text-center text-sm font-semibold text-[#A67C66] lg:col-span-2"
          >
            View all specialists →
          </Link>
        </div>
      )}
    </PatientHubLayout>
  );
}

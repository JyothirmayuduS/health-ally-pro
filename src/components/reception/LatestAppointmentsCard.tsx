import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getDoctorById } from "@/lib/reception-mock-data";
import type { ReceptionAppointment } from "@/lib/reception-mock-data";
import { useReceptionStore } from "@/lib/reception-store";

type Props = {
  appointments: ReceptionAppointment[];
  limit?: number;
};

export function LatestAppointmentsCard({ appointments, limit = 4 }: Props) {
  const { patients } = useReceptionStore();
  const items = appointments.slice(0, limit);

  return (
    <div className="flex h-full min-h-[480px] flex-col rounded-[28px] bg-[#E8F5C8] p-6 shadow-[0_4px_20px_rgba(28,42,46,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1C2A2E]">Latest Appointments</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            Stay updated on your last healthcare visit.
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#64748B] shadow-sm">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {items.map((appt) => {
          const patient = patients.find((p) => p.id === appt.patientId);
          const doctor = getDoctorById(appt.doctorId);
          if (!patient || !doctor) return null;
          const dateLabel = new Date(appt.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <li key={appt.id}>
              <Link
                to="/reception/appointments"
                className="group flex items-center gap-3.5 rounded-[20px] bg-white/75 p-3.5 transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
              >
                <img
                  src={patient.photoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[#1C2A2E]">{patient.name}</p>
                  <p className="truncate text-xs text-[#64748B]">
                    {doctor.specialty} · {dateLabel}
                  </p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#94A3B8] shadow-sm">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

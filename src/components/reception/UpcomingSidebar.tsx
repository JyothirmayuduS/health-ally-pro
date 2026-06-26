import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Calendar, Clock, MessageCircle } from "lucide-react";
import type { ReceptionDoctor, ReceptionAppointment } from "@/lib/reception-mock-data";
import { useReceptionStore } from "@/lib/reception-store";

type Props = {
  appointment: ReceptionAppointment | null;
  doctor: ReceptionDoctor | null;
};

export function UpcomingSidebar({ appointment, doctor }: Props) {
  const { patients } = useReceptionStore();
  const patient = appointment ? patients.find((p) => p.id === appointment.patientId) : null;

  if (!appointment || !doctor || !patient) {
    return (
      <div className="flex h-full min-h-[520px] flex-col rounded-[28px] bg-[#EEF6D4] p-6">
        <p className="text-sm text-[#64748B]">No upcoming appointments</p>
      </div>
    );
  }

  const dateLabel = new Date(appointment.date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[28px] bg-[#EEF6D4] shadow-[0_4px_20px_rgba(28,42,46,0.06)]">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-base font-bold text-[#1C2A2E]">Upcoming Appointment</h2>
        <Link
          to="/reception/appointments"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#64748B] shadow-sm"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="px-6">
        <h3 className="text-[1.65rem] font-bold leading-tight text-[#1C2A2E]">{doctor.name}</h3>
        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#D4F064] px-3.5 py-1.5 text-xs font-semibold text-[#1C2A2E]">
          {doctor.specialty}
        </span>
      </div>

      <div className="relative mx-6 my-5 flex min-h-[200px] flex-1 items-end justify-center overflow-hidden rounded-[24px] bg-gradient-to-b from-[#D4E8A8] to-[#EEF6D4]">
        <img
          src={doctor.photoUrl}
          alt={doctor.name}
          className="max-h-[240px] w-full object-contain object-bottom"
        />
        <button
          type="button"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-[#1C2A2E] text-white shadow-md"
          aria-label="Message"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 pb-2">
        <p className="text-xs font-semibold text-[#64748B]">About {doctor.name.split(" ").pop()}</p>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#64748B]">
          {doctor.bio ??
            `Specialist in ${doctor.specialty.toLowerCase()} with a patient-first approach at Medora Health.`}{" "}
          <button type="button" className="font-semibold text-[#1C2A2E] hover:underline">
            See more
          </button>
        </p>
      </div>

      <div className="space-y-2.5 px-6 pb-4">
        <div className="flex items-center gap-2.5 text-sm font-medium text-[#1C2A2E]">
          <Calendar className="h-4 w-4 text-[#64748B]" />
          <span>
            {dateLabel}, {appointment.time}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-[#1C2A2E]">
          <Clock className="h-4 w-4 text-[#64748B]" />
          <span>{appointment.duration} Minutes</span>
        </div>
        <p className="text-xs text-[#94A3B8]">Patient: {patient.name}</p>
      </div>

      <div className="mt-auto px-6 pb-6">
        <Link
          to="/reception/appointments"
          className="flex w-full items-center justify-center rounded-full bg-[#1C2A2E] py-4 text-sm font-semibold text-white hover:bg-[#2a3d44]"
        >
          Check Appointments
        </Link>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Calendar, Clock, MessageCircle } from "lucide-react";

export type UpcomingDoctor = {
  name: string;
  specialty: string;
  photoUrl: string;
  bio: string;
  date: string;
  time: string;
  duration: number;
  scheduleHref: string;
};

type Props = {
  doctor: UpcomingDoctor;
};

export function UpcomingAppointmentPanel({ doctor }: Props) {
  return (
    <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-[32px] bg-[#EEF6D4] shadow-[0_8px_32px_rgba(28,42,46,0.06)]">
      <header className="flex items-center justify-between px-7 pt-7 pb-3">
        <h2 className="text-base font-bold text-[#1C2A2E]">Upcoming Appointment</h2>
        <Link
          to={doctor.scheduleHref}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#64748B] shadow-[0_2px_8px_rgba(28,42,46,0.06)] transition-colors hover:text-[#1C2A2E]"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </header>

      <div className="px-7">
        <h3 className="text-[1.75rem] font-bold leading-tight tracking-tight text-[#1C2A2E]">
          {doctor.name}
        </h3>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#D4F064] px-4 py-1.5 text-xs font-bold text-[#1C2A2E]">
          {doctor.specialty}
        </span>
      </div>

      <div className="relative mx-7 my-6 flex min-h-[220px] flex-1 items-end justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-[#D4E8A8] to-[#EEF6D4]">
        <img
          src={doctor.photoUrl}
          alt={doctor.name}
          className="max-h-[260px] w-full object-contain object-bottom"
        />
        <button
          type="button"
          aria-label="Message doctor"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-[#1C2A2E] text-white shadow-[0_4px_16px_rgba(28,42,46,0.25)] transition-transform hover:scale-105"
        >
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <div className="px-7 pb-3">
        <p className="text-xs font-bold text-[#64748B]">
          About {doctor.name.replace(/^Dr\.\s*/, "Doctor ")}
        </p>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#64748B]">
          {doctor.bio}{" "}
          <button type="button" className="font-bold text-[#1C2A2E] hover:underline">
            See more
          </button>
        </p>
      </div>

      <div className="space-y-3 px-7 pb-5">
        <DetailRow icon={Calendar} text={`${doctor.date}, ${doctor.time}`} />
        <DetailRow icon={Clock} text={`${doctor.duration} Minutes`} />
      </div>

      <div className="mt-auto px-7 pb-7">
        <Link
          to={doctor.scheduleHref}
          className="flex w-full items-center justify-center rounded-full bg-[#1C2A2E] py-4 text-sm font-bold text-white shadow-[0_6px_20px_rgba(28,42,46,0.25)] transition-all hover:bg-[#2a3d44] hover:shadow-[0_8px_24px_rgba(28,42,46,0.3)] active:scale-[0.99]"
        >
          Check Appointments
        </Link>
      </div>
    </aside>
  );
}

function DetailRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white/50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-[#64748B]" strokeWidth={1.75} />
      <span className="text-sm font-semibold text-[#1C2A2E]">{text}</span>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Calendar, Grid3X3, Pill, Send } from "lucide-react";

const TOOLS = [
  { to: "/doctor/prescriptions", label: "Prescribe", Icon: Pill, bg: "#F0DDD6", color: "#B8735D" },
  { to: "/doctor/schedule", label: "Schedule", Icon: Calendar, bg: "#E8EFE6", color: "#1B3B2E" },
  { to: "/doctor/settings/referrals", label: "Referrals", Icon: Send, bg: "#F0DDD6", color: "#B8735D" },
  { to: "/doctor/settings/slots", label: "Booking slots", Icon: Grid3X3, bg: "#EDEAE6", color: "#1B3B2E" },
] as const;

export function DoctorClinicalShortcuts() {
  return (
    <section aria-label="Clinical tools">
      <h2 className="mb-2 text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">CLINICAL TOOLS</h2>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {TOOLS.map(({ to, label, Icon, bg, color }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-2 py-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: bg }}>
              <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.75} />
            </span>
            <span className="text-center text-[10px] font-semibold leading-tight text-[#1B3B2E] sm:text-[11px]">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

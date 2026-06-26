import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  UserPlus,
  UserCheck,
  ListOrdered,
  CalendarPlus,
  Users,
  Monitor,
} from "lucide-react";

const actions = [
  { id: "01", label: "Register", to: "/reception/register", variant: "jar" as const },
  { id: "02", label: "Check-in", to: "/reception/check-in", variant: "capsule" as const },
  { id: "03", label: "Queue", to: "/reception/queue", variant: "tube" as const },
  { id: "04", label: "Book Visit", to: "/reception/appointments/new", variant: "jar" as const },
  { id: "05", label: "Patients", to: "/reception/patients", variant: "dropper" as const },
  { id: "06", label: "TV Display", to: "/reception/token-display", variant: "jar" as const },
];

function ActionIcon({ variant }: { variant: string }) {
  const color = "#D4F064";
  return (
    <svg viewBox="0 0 48 64" className="h-14 w-10" aria-hidden>
      <ellipse cx="24" cy="58" rx="12" ry="4" fill="#E8ECED" />
      <path d="M16 18h16l2 38H14l2-38z" fill="#FFFEF8" stroke="#E5E0D0" strokeWidth="1" />
      <rect x="16" y="8" width="16" height="12" rx="4" fill={color} />
    </svg>
  );
}

export function QuickActionsGrid() {
  return (
    <div className="flex h-full min-h-[480px] flex-col rounded-[28px] bg-white p-6 shadow-[0_4px_20px_rgba(28,42,46,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1C2A2E]">Quick Actions</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            Tap any shortcut to manage front-desk workflows
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5F7F8] text-[#64748B]">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.to}
            className="flex flex-col rounded-[20px] bg-[#EEF6D4]/60 p-3.5 transition-shadow hover:shadow-md"
          >
            <span className="text-[11px] font-semibold text-[#CBD5E1]">{action.id}</span>
            <div className="flex flex-1 items-center justify-center py-2">
              <ActionIcon variant={action.variant} />
            </div>
            <p className="text-center text-xs font-semibold text-[#1C2A2E]">{action.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2">
        <span className="h-1.5 w-6 rounded-full bg-[#1C2A2E]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import {
  UserPlus,
  UserCheck,
  ListOrdered,
  CalendarPlus,
  Users,
  Monitor,
} from "lucide-react";
import { SectionCard } from "./SectionCard";

const actions = [
  { id: "01", label: "Register", to: "/reception/register", icon: UserPlus, tint: "#E8F0FE" },
  { id: "02", label: "Check-in", to: "/reception/check-in", icon: UserCheck, tint: "#EEF6D4" },
  { id: "03", label: "Queue", to: "/reception/queue", icon: ListOrdered, tint: "#E6F4F1" },
  {
    id: "04",
    label: "Book Visit",
    to: "/reception/appointments/new",
    icon: CalendarPlus,
    tint: "#FFF4D6",
  },
  { id: "05", label: "Patients", to: "/reception/patients", icon: Users, tint: "#FCE8F0" },
  { id: "06", label: "TV Display", to: "/reception/token-display", icon: Monitor, tint: "#E8ECED" },
] as const;

export function QuickActionsPanel() {
  return (
    <SectionCard
      variant="white"
      title="Quick Actions"
      subtitle="Tap any shortcut to manage front-desk workflows"
      className="min-h-[520px]"
    >
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.to}
              className="group flex flex-col rounded-[22px] bg-[#EEF6D4]/60 p-4 transition-all hover:bg-[#EEF6D4] hover:shadow-[0_6px_20px_rgba(28,42,46,0.08)]"
            >
              <span className="text-[11px] font-bold text-[#CBD5E1]">{action.id}</span>
              <div className="flex flex-1 items-center justify-center py-4">
                <span
                  className="grid h-16 w-16 place-items-center rounded-[20px] transition-transform group-hover:scale-105"
                  style={{ backgroundColor: action.tint }}
                >
                  <Icon className="h-7 w-7 text-[#1C2A2E]" strokeWidth={1.5} />
                </span>
              </div>
              <p className="text-center text-xs font-bold text-[#1C2A2E]">{action.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        <span className="h-1.5 w-7 rounded-full bg-[#1C2A2E]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
      </div>
    </SectionCard>
  );
}

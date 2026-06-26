import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  Beaker,
  Calendar,
  Grid3X3,
  MessageCircle,
  Phone,
  Pill,
  Stethoscope,
} from "lucide-react";
import { patientTelHref } from "@/lib/doctor-patient-contact";
import { cn } from "@/lib/utils";

type ActionDef = {
  id: string;
  label: string;
  icon: typeof MessageCircle;
  to?: string;
  search?: Record<string, string>;
  onClick?: () => void;
};

export function PatientChartActionRail({ patientId }: { patientId: string }) {
  const tel = patientTelHref(patientId);

  const actions: ActionDef[] = [
    {
      id: "message",
      label: "Message",
      icon: MessageCircle,
      to: "/doctor/messaging",
      search: { patientId },
    },
    {
      id: "rx",
      label: "Rx",
      icon: Pill,
      to: "/doctor/prescriptions",
      search: { patientId, view: "write" },
    },
    {
      id: "soap",
      label: "Note",
      icon: Stethoscope,
      to: "/doctor/encounters",
      search: { patientId },
    },
    {
      id: "labs",
      label: "Labs",
      icon: Beaker,
      to: "/doctor/orders",
      search: { patientId },
    },
    {
      id: "visit",
      label: "Schedule",
      icon: Calendar,
      to: "/doctor/schedule",
      search: { patientId },
    },
    {
      id: "call",
      label: "Call patient",
      icon: Phone,
      onClick: () => {
        if (tel) window.location.href = tel;
        else toast.message("No phone on file", { description: "Add contact in patient profile." });
      },
    },
    {
      id: "vitals",
      label: "Record vitals",
      icon: Activity,
      to: "/doctor/vitals",
      search: { patientId },
    },
    {
      id: "history",
      label: "Full history",
      icon: Grid3X3,
      to: "/doctor/patients/$patientId/history",
    },
  ];

  const renderAction = (action: ActionDef) => {
    const Icon = action.icon;
    const inner = (
      <span className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 lg:w-auto">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F5F2ED] text-[#1B3B2E]",
            action.id === "rx" && "bg-[#1B3B2E] text-white",
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-[#8A8F8C]">
          {action.label}
        </span>
      </span>
    );

    const className =
      "flex shrink-0 flex-col items-center rounded-xl px-1 py-2 transition-colors hover:bg-[#FAF9F7] lg:min-h-[72px] lg:justify-start";

    if (action.onClick) {
      return (
        <button key={action.id} type="button" onClick={action.onClick} className={className}>
          {inner}
        </button>
      );
    }

    if (action.to === "/doctor/patients/$patientId/history") {
      return (
        <Link key={action.id} to={action.to} params={{ patientId }} className={className}>
          {inner}
        </Link>
      );
    }

    if (action.to) {
      return (
        <Link key={action.id} to={action.to} search={action.search} className={className}>
          {inner}
        </Link>
      );
    }

    return null;
  };

  return (
    <article className="rounded-[20px] border border-[#EDEAE6] bg-white p-3 shadow-[0_2px_14px_rgba(27,59,46,0.05)] lg:p-4">
      {/* Mobile: horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
        {actions.map((action) => renderAction(action))}
      </div>
      {/* Desktop: compact grid */}
      <div className="hidden grid-cols-4 gap-1 lg:grid">
        {actions.map((action) => renderAction(action))}
      </div>
    </article>
  );
}

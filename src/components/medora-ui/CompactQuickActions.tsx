import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type QuickAction = {
  label: string;
  to: string;
  icon: LucideIcon;
};

type Props = {
  actions: QuickAction[];
};

export function CompactQuickActions({ actions }: Props) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Quick actions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.to}
            to={action.to}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8ECED] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C2A2E] shadow-[0_2px_6px_rgba(28,42,46,0.04)] transition-all hover:border-[#D4F064]/60 hover:bg-[#FAFCF5]"
          >
            <Icon className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.75} />
            {action.label}
          </Link>
        );
      })}
    </nav>
  );
}

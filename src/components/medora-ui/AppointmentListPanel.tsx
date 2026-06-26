import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SectionCard } from "./SectionCard";

export type AppointmentRow = {
  id: string;
  name: string;
  meta: string;
  photoUrl: string;
  href: string;
};

type Props = {
  items: AppointmentRow[];
  title?: string;
  subtitle?: string;
};

export function AppointmentListPanel({
  items,
  title = "Latest Appointments",
  subtitle = "Stay updated on your last healthcare visit.",
}: Props) {
  return (
    <SectionCard
      variant="lime"
      title={title}
      subtitle={subtitle}
      className="min-h-[420px]"
    >
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="group flex items-center gap-4 rounded-[22px] bg-white/80 p-4 transition-all duration-200 hover:bg-white hover:shadow-[0_6px_20px_rgba(28,42,46,0.08)]"
            >
              <img
                src={item.photoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-[3px] ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#1C2A2E]">{item.name}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-[#64748B]">{item.meta}</p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#94A3B8] shadow-sm transition-colors group-hover:bg-[#1C2A2E] group-hover:text-white">
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

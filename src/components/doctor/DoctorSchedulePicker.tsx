import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  className?: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function DoctorSchedulePicker({ selectedDate, onSelect, className }: Props) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const today = new Date();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long" });

  return (
    <div className={cn("rounded-[28px] bg-white p-6 shadow-[0_8px_32px_rgba(28,42,46,0.06)]", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-[#1B3B2E]">Schedule</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setViewMonth((m) => (m === 0 ? 11 : m - 1))} className="rounded-lg p-1 hover:bg-[#E8E4DF]">
            <ChevronLeft className="h-4 w-4 text-[#8A8F8C]" />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#8A8F8C]">
            <Calendar className="h-4 w-4" />
            {monthName}
          </span>
          <button type="button" onClick={() => setViewMonth((m) => (m === 11 ? 0 : m + 1))} className="rounded-lg p-1 hover:bg-[#E8E4DF]">
            <ChevronRight className="h-4 w-4 text-[#8A8F8C]" />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const date = new Date(viewYear, viewMonth, day);
          const isSelected =
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                "flex h-14 min-w-[3rem] flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all",
                isSelected && "bg-[#1B3B2E] text-white",
                !isSelected && isToday && "bg-[#B8735D] text-white",
                !isSelected && !isToday && "bg-[#F5F2ED] text-[#8A8F8C] hover:bg-[#F0DDD6]",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ScheduleDatePickerProps = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  className?: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function ScheduleDatePicker({ selectedDate, onSelect, className }: ScheduleDatePickerProps) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const today = new Date();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long" });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div
      className={cn("rounded-[20px] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]", className)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[#1e293b]">Schedule</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} className="rounded-lg p-1 hover:bg-[#E0E7EB]">
            <ChevronLeft className="h-4 w-4 text-[#64748B]" />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#64748B]">
            <Calendar className="h-4 w-4" />
            {monthName}
          </span>
          <button type="button" onClick={nextMonth} className="rounded-lg p-1 hover:bg-[#E0E7EB]">
            <ChevronRight className="h-4 w-4 text-[#64748B]" />
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
                "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full text-sm font-medium transition-all",
                isSelected
                  ? "bg-[#D4F06D] text-[#1e293b] shadow-sm"
                  : isToday
                    ? "bg-[#EEF6D4] text-[#4D7C0F]"
                    : "bg-[#F5F7F8] text-[#64748B] hover:bg-[#E0E7EB]",
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, Circle, ClipboardList } from "lucide-react";
import { PANEL_TASKS } from "@/lib/doctor-patients-apk-data";
import { panelCounts } from "@/lib/doctor-clinic-overview";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/patients/tasks")({
  component: DoctorPatientTasks,
});

function DoctorPatientTasks() {
  const openTasks = PANEL_TASKS.filter((t) => !t.done);
  const counts = panelCounts();

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 pb-4">
      <header className="flex items-start gap-3">
        <Link
          to="/doctor/patients"
          search={{ view: "panel" }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-[#1B3B2E]" />
        </Link>
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-[#1B3B2E]">Tasks</h1>
          <p className="text-sm text-[#8A8F8C]">{openTasks.length} open on your panel</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          to="/doctor/patients"
          search={{ view: "panel" }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-semibold text-[#8A8F8C]"
        >
          {counts.panel} Panel
        </Link>
        <Link
          to="/doctor/patients"
          search={{ view: "today" }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-semibold text-[#8A8F8C]"
        >
          {counts.today} Today
        </Link>
        <Link
          to="/doctor/patients"
          search={{ view: "urgent" }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-semibold text-[#8A8F8C]"
        >
          {counts.urgent} Urgent
        </Link>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-transparent bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white">
          <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
          {openTasks.length} Tasks
        </span>
      </div>

      <div className="rounded-[22px] bg-white shadow-[0_4px_20px_rgba(27,59,46,0.05)] divide-y divide-[#F0EDE8]">
        {PANEL_TASKS.map((task) => (
          <Link
            key={task.id}
            to="/doctor/patients/$patientId"
            params={{ patientId: task.patientId }}
            className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[#FAF8F5]"
          >
            {task.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3B2E]" strokeWidth={1.75} />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#C5D9C0]" strokeWidth={1.75} />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", task.done ? "text-[#ADADAD] line-through" : "font-medium text-[#1B3B2E]")}>
                {task.title}
              </p>
              <p className={cn("mt-0.5 text-xs", task.urgent && !task.done ? "font-medium text-[#C45C4A]" : "text-[#8A8F8C]")}>
                {task.patientName} · {task.due}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

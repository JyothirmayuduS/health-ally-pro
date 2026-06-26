import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  MessageCircle,
  Phone,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type PanelPatient,
  type PanelView,
  type PatientStatus,
  patientsForView,
} from "@/lib/doctor-patients-apk-data";
import { panelCounts } from "@/lib/doctor-clinic-overview";
import { getPatientQueueStatus } from "@/lib/doctor-patient-queue";
import { patientTelHref } from "@/lib/doctor-patient-contact";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { cn } from "@/lib/utils";

function flagPillLink(
  pill: string,
  patientId: string,
): { to: "/doctor/patients/$patientId"; search?: { section: string } } | null {
  if (pill === "Overview") return { to: "/doctor/patients/$patientId" };
  if (pill === "Open items") return { to: "/doctor/patients/$patientId", search: { section: "open-items" } };
  return null;
}

function patientMatchesAge(patient: PanelPatient, ageGroup: string) {
  if (ageGroup === "All") return true;
  const age = patient.age;
  if (ageGroup === "0–18") return age <= 18;
  if (ageGroup === "18–40") return age > 18 && age <= 40;
  if (ageGroup === "40–60") return age > 40 && age <= 60;
  if (ageGroup === "60+") return age > 60;
  return true;
}

function patientMatchesVisit(patient: PanelPatient, visitFilter: string) {
  if (visitFilter === "Any time") return true;
  if (visitFilter === "Last 7 days") return patient.categories.includes("today");
  if (visitFilter === "Last 30 days") return !patient.categories.includes("past");
  if (visitFilter === "Overdue >30 days") return patient.categories.includes("follow-up");
  return true;
}

type SortOption = "priority" | "last-visit" | "name" | "condition";

export const Route = createFileRoute("/doctor/patients/")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: (["panel", "today", "urgent"].includes(String(search.view))
      ? String(search.view)
      : "panel") as PanelView,
    category: (["all", "follow-up", "upcoming"].includes(String(search.category))
      ? String(search.category)
      : "all") as "all" | "follow-up" | "upcoming",
  }),
  component: DoctorPatientsList,
});

const SORT_OPTIONS: { id: SortOption; label: string; hint: string }[] = [
  { id: "priority", label: "Clinical priority", hint: "Urgent cases, follow-ups, and open tasks first" },
  { id: "last-visit", label: "Last visit", hint: "Patients seen most recently appear first" },
  { id: "name", label: "Name A–Z", hint: "Alphabetical order by patient name" },
  { id: "condition", label: "Condition", hint: "Grouped by primary diagnosis" },
];

const FILTER_SECTIONS = [
  { title: "Condition", key: "condition", options: ["All", "Diabetes", "Hypertension", "Asthma", "Cardiac"] },
  { title: "Status", key: "status", options: ["Urgent", "Monitoring", "Stable", "Critical"] },
  { title: "Last visit", key: "visit", options: ["Any time", "Last 7 days", "Last 30 days", "Overdue >30 days"] },
  { title: "Gender", key: "gender", options: ["All", "Male", "Female"] },
  { title: "Age group", key: "age", options: ["All", "0–18", "18–40", "40–60", "60+"] },
] as const;

const STATUS_BADGE: Record<PatientStatus, string> = {
  Urgent: "bg-[#FCE8E6] text-[#C45C4A]",
  Stable: "bg-[#E8EFE6] text-[#1B3B2E]",
  Monitoring: "bg-[#F5E6B8] text-[#5C4A1E]",
  Critical: "bg-[#FCE8E6] text-[#C45C4A]",
};

const PRIMARY_CHIPS = [
  { id: "panel" as const, label: "Panel", icon: Users, to: "/doctor/patients" as const, search: { view: "panel" as const, category: "all" as const } },
  { id: "today" as const, label: "Today", icon: Calendar, to: "/doctor/patients" as const, search: { view: "today" as const, category: "all" as const } },
  { id: "urgent" as const, label: "Urgent", icon: AlertTriangle, to: "/doctor/patients" as const, search: { view: "urgent" as const, category: "all" as const } },
  { id: "tasks" as const, label: "Tasks", icon: ClipboardList, to: "/doctor/patients/tasks" as const, search: undefined },
] as const;

const MORE_VIEW_CHIPS = [
  { id: "follow-up" as const, label: "Follow-up", icon: ClipboardList, to: "/doctor/patients" as const, search: { view: "panel" as const, category: "follow-up" as const } },
  { id: "upcoming" as const, label: "Upcoming", icon: Calendar, to: "/doctor/patients" as const, search: { view: "panel" as const, category: "upcoming" as const } },
] as const;

const QUEUE_STATUS_STYLE = {
  serving: "bg-[#1B3B2E] text-white",
  waiting: "bg-[#F5E6B8] text-[#5C4A1E]",
  completed: "bg-[#E8EFE6] text-[#1B3B2E]",
  none: "bg-[#F5F2ED] text-[#8A8F8C]",
} as const;

function DoctorPatientsList() {
  const { view, category } = Route.useSearch();
  const navigate = useNavigate();
  const { entries } = useLiveQueue();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("priority");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreViewsOpen, setMoreViewsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    condition: "All",
    visit: "Any time",
    gender: "All",
    age: "All",
  });
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const counts = panelCounts();
  const patients = useMemo(() => {
    let list = patientsForView(view).filter((p) => {
      const q = search.trim().toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.condition.toLowerCase().includes(q) && !p.patientRef.toLowerCase().includes(q)) {
        return false;
      }
      if (category !== "all" && !p.categories.includes(category)) return false;

      if (filterValues.condition !== "All" && p.condition !== filterValues.condition) return false;
      if (filterValues.gender !== "All") {
        const gender = filterValues.gender === "Male" ? "M" : "F";
        if (p.gender !== gender) return false;
      }
      if (!patientMatchesAge(p, filterValues.age)) return false;
      if (!patientMatchesVisit(p, filterValues.visit)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(p.status)) return false;

      return true;
    });

    if (sort === "priority") list = [...list].sort((a, b) => a.priority - b.priority);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "condition") list = [...list].sort((a, b) => a.condition.localeCompare(b.condition));
    if (sort === "last-visit") list = [...list].sort((a, b) => a.priority - b.priority);

    return list;
  }, [search, sort, view, category, filterValues, statusFilters]);

  const viewChips = PRIMARY_CHIPS.map((chip) => ({
    ...chip,
    label:
      chip.id === "panel"
        ? `${counts.panel} Panel`
        : chip.id === "today"
          ? `${counts.today} Today`
          : chip.id === "urgent"
            ? `${counts.urgent} Urgent`
            : `${counts.tasks} Tasks`,
    badge: chip.id === "urgent" && counts.urgent > 0 ? counts.urgent : undefined,
  }));

  const isChipActive = (chip: { id: string; search?: { view: PanelView; category: string } }) => {
    if (chip.id === "tasks") return false;
    if (!chip.search) return false;
    if (chip.search.category !== "all") return view === chip.search.view && category === chip.search.category;
    return view === chip.search.view && category === "all";
  };

  const moreViewActive = MORE_VIEW_CHIPS.some((c) => isChipActive(c));

  const sortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? "Priority";
  const panelSubtitle =
    view === "today"
      ? `${counts.today} seen today`
      : view === "urgent"
        ? "Urgent cases needing attention"
        : category === "follow-up"
          ? "Follow-ups on your panel"
          : category === "upcoming"
            ? "Upcoming visits"
            : "Your active patient panel";

  return (
    <div className="relative mx-auto w-full max-w-[1400px] space-y-4 pb-4 lg:space-y-5 lg:pb-6">
      <header>
        <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">Patients</h1>
        <p className="mt-0.5 text-sm text-[#8A8F8C]">{panelSubtitle}</p>
      </header>

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A8F8C]" strokeWidth={1.75} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, condition, or ID"
            className="h-11 w-full rounded-2xl border border-[#E8E4DF] bg-white pl-10 pr-4 text-sm text-[#1B3B2E] placeholder:text-[#ADADAD] outline-none focus:border-[#B8735D]/40"
          />
        </label>
        <button
          type="button"
          aria-label="Advanced filters"
          onClick={() => setFiltersOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#E8E4DF] bg-white text-[#1B3B2E]"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {viewChips.map((chip) => {
          const Icon = chip.icon;
          const isActive = isChipActive(chip);
          return (
            <Link
              key={chip.id}
              to={chip.to}
              search={chip.search}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-transparent bg-[#1B3B2E] text-white"
                  : "border-[#E8E4DF] bg-white text-[#8A8F8C] hover:text-[#1B3B2E]",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {chip.label}
              {chip.badge != null && chip.badge > 0 && (
                <span className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C45C4A] px-1 text-[10px] font-bold text-white">
                  {chip.badge}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreViewsOpen(true)}
          className={cn(
            "relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            moreViewActive
              ? "border-transparent bg-[#1B3B2E] text-white"
              : "border-[#E8E4DF] bg-white text-[#8A8F8C] hover:text-[#1B3B2E]",
          )}
        >
          More
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">{patients.length} PATIENTS</p>
        <button type="button" onClick={() => setSortOpen(true)} className="flex items-center gap-1 text-[11px] font-medium text-[#8A8F8C]">
          Sort: <span className="font-semibold text-[#1B3B2E]">{sortLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#B8735D]" />
        </button>
      </div>

      {/* Card grid — mobile / tablet */}
      <div className="space-y-3 lg:hidden">
        {patients.map((patient) => {
          const queueStatus = getPatientQueueStatus(patient.id, entries);
          const tel = patientTelHref(patient.id);
          return (
            <article
              key={patient.id}
              className="relative overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white shadow-[0_2px_14px_rgba(27,59,46,0.05)]"
            >
              <div className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full" style={{ backgroundColor: patient.accent }} aria-hidden />
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: patient.id }}
                className="block p-4 pl-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F0DDD6] text-xs font-semibold text-[#1B3B2E]">
                    {patient.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#1B3B2E]">{patient.name}</p>
                        <p className="mt-0.5 text-xs text-[#8A8F8C]">
                          {patient.condition} · {patient.age}y {patient.gender}
                        </p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_BADGE[patient.status])}>
                        {patient.status}
                      </span>
                    </div>
                  </div>
                </div>
                {patient.alert && <p className="mt-3 text-sm font-semibold text-[#C45C4A]">{patient.alert}</p>}
                <p className={cn("text-xs text-[#B8735D]", patient.alert ? "mt-1" : "mt-3")}>{patient.timeline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-medium", QUEUE_STATUS_STYLE[queueStatus.kind])}>
                    {queueStatus.kind === "none" ? "Not in queue" : queueStatus.label}
                  </span>
                  {patient.pills.slice(0, 2).map((pill) => {
                    const link = flagPillLink(pill, patient.id);
                    if (link) {
                      return (
                        <Link
                          key={pill}
                          to={link.to}
                          params={{ patientId: patient.id }}
                          search={link.search}
                          className="rounded-lg bg-[#F5F2ED] px-2.5 py-1 text-[11px] font-medium text-[#B8735D] hover:bg-[#EDEAE6]"
                        >
                          {pill}
                        </Link>
                      );
                    }
                    return (
                      <span key={pill} className="rounded-lg bg-[#F5F2ED] px-2.5 py-1 text-[11px] font-medium text-[#8A8F8C]">
                        {pill}
                      </span>
                    );
                  })}
                </div>
              </Link>
              <div className="flex border-t border-[#F0EDE9]">
                <Link
                  to="/doctor/messaging"
                  search={{ patientId: patient.id }}
                  className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#8A8F8C] hover:bg-[#FAFAF8]"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Message
                </Link>
                {tel ? (
                  <a
                    href={tel}
                    className="flex flex-1 items-center justify-center gap-1.5 border-l border-[#F0EDE9] py-3 text-xs font-semibold text-[#8A8F8C] hover:bg-[#FAFAF8]"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Call
                  </a>
                ) : (
                  <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 border-l border-[#F0EDE9] py-3 text-xs font-semibold text-[#C5C5C5]">
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Call
                  </span>
                )}
                <Link
                  to="/doctor/patients/$patientId"
                  params={{ patientId: patient.id }}
                  className="flex flex-1 items-center justify-center gap-1.5 border-l border-[#F0EDE9] py-3 text-xs font-semibold text-[#B8735D] hover:bg-[#FAFAF8]"
                >
                  Chart
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Compact table — desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#EDEAE6] bg-[#FAFAF8] text-[10px] font-bold tracking-[0.1em] text-[#8A8F8C]">
              <th className="px-4 py-3 font-bold">PATIENT</th>
              <th className="px-4 py-3 font-bold">CONDITION</th>
              <th className="px-4 py-3 font-bold">STATUS</th>
              <th className="px-4 py-3 font-bold">QUEUE</th>
              <th className="px-4 py-3 font-bold">LAST SEEN</th>
              <th className="px-4 py-3 font-bold">FLAGS</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EDE9]">
            {patients.map((patient) => {
              const queueStatus = getPatientQueueStatus(patient.id, entries);
              const tel = patientTelHref(patient.id);
              return (
              <tr
                key={patient.id}
                className="group cursor-pointer hover:bg-[#FAFAF8]"
                onClick={() =>
                  navigate({ to: "/doctor/patients/$patientId", params: { patientId: patient.id } })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/doctor/patients/$patientId", params: { patientId: patient.id } });
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open chart for ${patient.name}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0DDD6] text-xs font-semibold text-[#1B3B2E]">
                      {patient.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1B3B2E] group-hover:underline">{patient.name}</p>
                      <p className="text-xs text-[#8A8F8C]">{patient.patientRef}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#1B3B2E]">{patient.condition}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_BADGE[patient.status])}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", QUEUE_STATUS_STYLE[queueStatus.kind])}>
                    {queueStatus.kind === "none" ? "—" : queueStatus.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#8A8F8C]">{patient.lastSeen}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {patient.pills.slice(0, 2).map((pill) => {
                      const link = flagPillLink(pill, patient.id);
                      if (link) {
                        return (
                          <Link
                            key={pill}
                            to={link.to}
                            params={{ patientId: patient.id }}
                            search={link.search}
                            className="rounded-md bg-[#F5F2ED] px-2 py-0.5 text-[10px] font-medium text-[#B8735D] hover:bg-[#EDEAE6]"
                          >
                            {pill}
                          </Link>
                        );
                      }
                      return (
                        <span key={pill} className="rounded-md bg-[#F5F2ED] px-2 py-0.5 text-[10px] font-medium text-[#8A8F8C]">
                          {pill}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Link to="/doctor/messaging" search={{ patientId: patient.id }} aria-label={`Message ${patient.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E8E4DF] text-[#8A8F8C] hover:bg-[#F5F2ED]">
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                    {tel ? (
                      <a href={tel} aria-label={`Call ${patient.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E8E4DF] text-[#8A8F8C] hover:bg-[#F5F2ED]">
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </a>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#F0EDE9] text-[#C5C5C5]">
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </span>
                    )}
                    <Link
                      to="/doctor/patients/$patientId"
                      params={{ patientId: patient.id }}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B3B2E] text-white"
                      aria-label={`Open chart for ${patient.name}`}
                    >
                      <ChevronDown className="h-3.5 w-3.5 -rotate-90" strokeWidth={1.75} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {patients.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-[#E8E4DF] bg-white/60 px-6 py-12 text-center">
          <p className="text-sm font-medium text-[#1B3B2E]">No patients match this view</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/doctor/patients", search: { view: "panel", category: "all" } })}
            className="mt-3 text-sm font-semibold text-[#B8735D]"
          >
            Show full panel
          </button>
        </div>
      )}

      <Sheet open={moreViewsOpen} onOpenChange={setMoreViewsOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-[#E8E4DF] bg-white px-0 pb-8 pt-3 [&>button]:hidden">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E4DF]" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="font-serif text-xl font-semibold text-[#1B3B2E]">More views</SheetTitle>
          </SheetHeader>
          <ul className="mt-2 divide-y divide-[#F0EDE8]">
            {MORE_VIEW_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = isChipActive(chip);
              return (
                <li key={chip.id}>
                  <Link
                    to={chip.to}
                    search={chip.search}
                    onClick={() => setMoreViewsOpen(false)}
                    className={cn("flex items-center gap-3 px-5 py-4", active && "bg-[#F5F2ED]")}
                  >
                    <Icon className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
                    <span className="text-sm font-semibold text-[#1B3B2E]">{chip.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-[#E8E4DF] bg-white px-0 pb-8 pt-3 [&>button]:hidden">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E4DF]" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="font-serif text-xl font-semibold text-[#1B3B2E]">Sort by</SheetTitle>
          </SheetHeader>
          <ul className="mt-2 divide-y divide-[#F0EDE8]">
            {SORT_OPTIONS.map((option) => {
              const selected = sort === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSort(option.id);
                      setSortOpen(false);
                    }}
                    className={cn("flex w-full items-start justify-between gap-3 px-5 py-4 text-left", selected && "bg-[#F5F2ED]")}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1B3B2E]">{option.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#8A8F8C]">{option.hint}</p>
                    </div>
                    {selected ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3B2E]" strokeWidth={2} />
                    ) : (
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-[#E8E4DF]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-[28px] border-[#E8E4DF] bg-white px-0 pb-6 pt-3 [&>button]:hidden">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E4DF]" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="font-serif text-xl font-semibold text-[#1B3B2E]">Advanced filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5 px-5">
            {FILTER_SECTIONS.map((section) => (
              <div key={section.key}>
                <p className="mb-2.5 text-[11px] font-semibold tracking-[0.08em] text-[#8A8F8C]">{section.title.toUpperCase()}</p>
                <div className="flex flex-wrap gap-2">
                  {section.options.map((option) => {
                    const isStatus = section.key === "status";
                    const active = isStatus ? statusFilters.includes(option) : filterValues[section.key] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (isStatus) {
                            setStatusFilters((prev) =>
                              prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option],
                            );
                          } else {
                            setFilterValues((prev) => ({ ...prev, [section.key]: option }));
                          }
                        }}
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                          active ? "bg-[#1B3B2E] text-white" : "bg-[#F5F2ED] text-[#1B3B2E]",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3 px-5">
            <button
              type="button"
              onClick={() => {
                setFilterValues({ condition: "All", visit: "Any time", gender: "All", age: "All" });
                setStatusFilters([]);
              }}
              className="flex-1 rounded-xl border border-[#E8E4DF] bg-white py-3 text-sm font-semibold text-[#1B3B2E]"
            >
              Reset
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="flex-[1.4] rounded-xl bg-[#1B3B2E] py-3 text-sm font-semibold text-white">
              Apply
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

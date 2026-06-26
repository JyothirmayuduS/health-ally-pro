import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  openPatientSearch,
  PATIENT_SEARCH_EVENT,
  searchPatientRecords,
  type PatientSearchResult,
} from "@/lib/patient-search";
import { doctors as mockDoctors, reports as mockReports } from "@/lib/mock-data";
import { patientMedications } from "@/lib/mock-data";
import { fetchDoctors, fetchReportsForPatient } from "@/lib/supabase/queries";
import { ChefHat, Dumbbell, FileText, Pill, Stethoscope } from "lucide-react";

const QUICK_LINKS = [
  { label: "Home dashboard", to: "/" },
  { label: "Care hub", to: "/care" },
  { label: "Health hub", to: "/health" },
  { label: "Book appointment", to: "/book" },
  { label: "Clinical diet", to: "/diet" },
  { label: "Exercise recovery", to: "/exercise" },
  { label: "Profile", to: "/profile" },
] as const;

const CATEGORY_ICONS = {
  doctor: Stethoscope,
  report: FileText,
  medication: Pill,
  diet: ChefHat,
  exercise: Dumbbell,
} as const;

const CATEGORY_LABELS = {
  doctor: "Doctors",
  report: "Reports",
  medication: "Medications",
  diet: "Diet",
  exercise: "Exercise",
} as const;

export function PatientCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [doctorList, setDoctorList] = useState(mockDoctors);
  const [reportList, setReportList] = useState(mockReports);

  useEffect(() => {
    if (!open) return;
    fetchDoctors().then((d) => d.length && setDoctorList(d));
    fetchReportsForPatient().then((r) => r.length && setReportList(r));
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PATIENT_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(PATIENT_SEARCH_EVENT, onOpen);
  }, []);

  const results = useMemo(
    () =>
      searchPatientRecords(search, {
        doctors: doctorList,
        reports: reportList,
        medications: patientMedications.filter((m) => m.status !== "past"),
      }),
    [search, doctorList, reportList],
  );

  const grouped = useMemo(() => {
    const map = new Map<PatientSearchResult["category"], PatientSearchResult[]>();
    for (const r of results) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [results]);

  const go = useCallback(
    (to: string, params?: Record<string, string>) => {
      setOpen(false);
      setSearch("");
      navigate({ to, params });
    },
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search doctors, reports, medications, meals, exercises…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>

        {!search.trim() && (
          <CommandGroup heading="Quick links">
            {QUICK_LINKS.map((link) => (
              <CommandItem
                key={link.to}
                value={link.label}
                onSelect={() => go(link.to)}
              >
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {search.trim() && (
          <>
            {(["doctor", "report", "medication", "diet"] as const).map((cat) => {
              const items = grouped.get(cat);
              if (!items?.length) return null;
              const Icon = CATEGORY_ICONS[cat];
              return (
                <CommandGroup key={cat} heading={CATEGORY_LABELS[cat]}>
                  {items.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={`${hit.title} ${hit.subtitle}`}
                      onSelect={() => go(hit.to, hit.params)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{hit.title}</span>
                        <span className="block truncate text-xs text-ink-muted">{hit.subtitle}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            <CommandSeparator />
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export { openPatientSearch };

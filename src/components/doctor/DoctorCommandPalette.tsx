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
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import { semanticSearch } from "@/lib/ai/semantic-search";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import { Sparkles } from "lucide-react";

const QUICK_LINKS = [
  { label: "Today home", to: "/doctor" },
  { label: "Live queue", to: "/doctor/queue" },
  { label: "Schedule", to: "/doctor/schedule" },
  { label: "Inbox", to: "/doctor/reports" },
  { label: "Prescribe", to: "/doctor/prescriptions" },
  { label: "Referrals", to: "/doctor/settings/referrals" },
  { label: "Profile settings", to: "/doctor/settings" },
] as const;

export function DoctorCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const aiHits = useMemo(() => semanticSearch(search, 8), [search]);

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
    window.addEventListener("medora-doctor-open-search", onOpen);
    return () => window.removeEventListener("medora-doctor-open-search", onOpen);
  }, []);

  const go = useCallback(
    (to: string) => {
      setOpen(false);
      navigate({ to });
    },
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search patients, drugs, or jump to…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {search.trim() && aiHits.length > 0 && (
          <CommandGroup heading="Medora AI search">
            {aiHits.map((hit) => (
              <CommandItem
                key={hit.chunk.id}
                value={`${hit.chunk.title} ${hit.chunk.body}`}
                onSelect={() => {
                  if (hit.chunk.to) {
                    setOpen(false);
                    setSearch("");
                    navigate({ to: hit.chunk.to });
                  }
                }}
              >
                <Sparkles className="mr-2 h-3.5 w-3.5 text-[#B8735D]" />
                <span>{hit.chunk.title}</span>
                <span className="ml-auto text-xs text-[#8A8F8C]">{hit.chunk.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Patients">
          {PANEL_PATIENTS.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.condition} ${p.patientRef}`}
              onSelect={() => {
                setOpen(false);
                navigate({ to: "/doctor/patients/$patientId", params: { patientId: p.id } });
              }}
            >
              <span className="mr-2 font-bold text-[#B8735D]">{p.initials}</span>
              <span>{p.name}</span>
              <span className="ml-auto text-xs text-[#8A8F8C]">{p.condition}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Formulary">
          {DRUGS.slice(0, 12).map((d) => (
            <CommandItem
              key={d.id}
              value={`${d.generic_name} ${d.strength} ${d.form}`}
              onSelect={() => {
                setOpen(false);
                setSearch("");
                navigate({ to: "/doctor/prescriptions", search: { patientId: PANEL_PATIENTS[0]?.id } });
              }}
            >
              <span className="font-medium text-[#1B3B2E]">{d.generic_name}</span>
              <span className="ml-2 text-xs text-[#8A8F8C]">{d.strength}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {QUICK_LINKS.map((link) => (
            <CommandItem key={link.to} value={link.label} onSelect={() => go(link.to)}>
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function openDoctorCommandPalette() {
  window.dispatchEvent(new CustomEvent("medora-doctor-open-search"));
}

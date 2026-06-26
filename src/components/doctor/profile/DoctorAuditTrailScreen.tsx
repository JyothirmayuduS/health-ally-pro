import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, FileText, Send, Stethoscope } from "lucide-react";
import { DoctorProfileSubpage, ProfileEmptyState } from "./DoctorProfileSubpage";
import { listEncounters, ENCOUNTERS_EVENT } from "@/lib/shared/encounters";
import { listResultDocuments } from "@/lib/doctor-results-imaging";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { cn } from "@/lib/utils";

type AuditFilter = "all" | "encounter" | "referral" | "result";

type AuditEntry = {
  id: string;
  type: Exclude<AuditFilter, "all">;
  title: string;
  detail: string;
  actor: string;
  relativeTime: string;
  navigateTo: string;
  navigateParams?: { referralId: string };
};

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function DoctorAuditTrailScreen() {
  const store = useProfileStore();
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState(() => listEncounters());
  const [filter, setFilter] = useState<AuditFilter>("all");

  useEffect(() => {
    const refresh = () => setEncounters(listEncounters());
    window.addEventListener(ENCOUNTERS_EVENT, refresh);
    return () => window.removeEventListener(ENCOUNTERS_EVENT, refresh);
  }, []);

  const allEntries = useMemo(() => {
    const list: AuditEntry[] = [];

    for (const enc of encounters) {
      if (enc.soap?.signedAt) {
        list.push({
          id: `enc-${enc.id}`,
          type: "encounter",
          title: "Encounter signed",
          detail: `${enc.patientName} · ${enc.chiefComplaint ?? "Consultation"}`,
          actor: enc.doctorName ?? "You",
          relativeTime: relativeTime(enc.soap.signedAt),
          navigateTo: "/doctor/encounters",
        });
      } else if (enc.status === "open") {
        list.push({
          id: `enc-open-${enc.id}`,
          type: "encounter",
          title: "Encounter opened",
          detail: `${enc.patientName} · ${enc.chiefComplaint ?? "Check-in"}`,
          actor: enc.doctorName ?? "Reception",
          relativeTime: relativeTime(enc.createdAt),
          navigateTo: "/doctor/encounters",
        });
      }
    }

    for (const ref of store.referrals) {
      const latest = ref.history[0];
      if (latest) {
        list.push({
          id: `ref-${ref.id}-${latest.id}`,
          type: "referral",
          title: latest.title,
          detail: `${ref.patientName} · ${ref.specialty}`,
          actor: latest.actor,
          relativeTime: ref.relativeTime,
          navigateTo: "/doctor/settings/referrals/$referralId",
          navigateParams: { referralId: ref.id },
        });
      }
    }

    for (const doc of listResultDocuments()) {
      const signed = doc.history.find((h) => h.action.toLowerCase().includes("signed"));
      if (signed || doc.status === "Signed off") {
        const event = signed ?? doc.history[0];
        if (event) {
          list.push({
            id: `res-${doc.id}`,
            type: "result",
            title: event.action,
            detail: `${doc.title} · ${doc.source}`,
            actor: event.actor,
            relativeTime: event.relativeTime,
            navigateTo: "/doctor/reports",
          });
        }
      }
    }

    return list;
  }, [encounters, store.referrals]);

  const entries = useMemo(
    () => (filter === "all" ? allEntries : allEntries.filter((e) => e.type === filter)),
    [allEntries, filter],
  );

  const FILTERS: { id: AuditFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: allEntries.length },
    {
      id: "encounter",
      label: "Encounters",
      count: allEntries.filter((e) => e.type === "encounter").length,
    },
    {
      id: "referral",
      label: "Referrals",
      count: allEntries.filter((e) => e.type === "referral").length,
    },
    {
      id: "result",
      label: "Results",
      count: allEntries.filter((e) => e.type === "result").length,
    },
  ];

  const iconFor = (type: AuditEntry["type"]) => {
    if (type === "encounter") return Stethoscope;
    if (type === "referral") return Send;
    return FileText;
  };

  const openEntry = (entry: AuditEntry) => {
    if (entry.navigateParams) {
      navigate({
        to: "/doctor/settings/referrals",
        search: { id: entry.navigateParams.referralId },
      });
    } else {
      navigate({ to: entry.navigateTo as "/doctor/encounters" | "/doctor/reports" });
    }
  };

  return (
    <DoctorProfileSubpage
      title="Audit trail"
      subtitle="Clinical actions on this device"
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Audit trail" },
      ]}
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filter === f.id
                ? "bg-[#1B3B2E] text-white"
                : "border border-[#E8E4DF] bg-white text-[#8A8F8C]",
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn("ml-1.5 tabular-nums", filter === f.id ? "text-white/80" : "text-[#ADADAD]")}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <ProfileEmptyState
          title={filter === "all" ? "No audit entries yet" : `No ${filter} actions`}
          description={
            filter === "all"
              ? "Signed encounters, referrals, and result sign-offs will appear here."
              : `Try another filter or complete a ${filter} action in the app.`
          }
        />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const Icon = iconFor(entry.type);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className="flex w-full items-start gap-3 rounded-[18px] border border-[#EDEAE6] bg-white p-4 text-left shadow-sm transition-all hover:border-[#B8735D]/30 hover:shadow-md active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8EFE6]">
                    <Icon className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#1B3B2E]">{entry.title}</p>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#8A8F8C]">
                        <Clock className="h-3 w-3" />
                        {entry.relativeTime}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[#8A8F8C]">{entry.detail}</p>
                    <p className="mt-1 text-xs text-[#ADADAD]">{entry.actor}</p>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#CBD5E1]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DoctorProfileSubpage>
  );
}

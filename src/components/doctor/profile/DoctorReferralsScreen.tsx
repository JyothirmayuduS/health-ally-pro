import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Inbox, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DoctorProfileSubpage,
  ProfileEmptyState,
  ProfileSectionCard,
} from "./DoctorProfileSubpage";
import { REFERRAL_SPECIALTIES } from "@/lib/doctor-profile-workspace";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import {
  acceptReferral,
  addReferral,
  declineReferral,
  getReferralById,
  referralsAwaitingCount,
} from "@/lib/doctor-profile-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { useDoctorMobileOverlay } from "@/lib/doctor-mobile-chrome";
import type { DoctorReferral } from "@/lib/doctor-profile-workspace";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "history" | "sent" | "received" | "pending";

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-[#F5E6B8] text-[#5C4A1E]",
  Accepted: "bg-[#E8EFE6] text-[#1B3B2E]",
  Declined: "bg-[#FCE8E6] text-[#C45C4A]",
  Completed: "bg-[#EDEAE6] text-[#6B6B6B]",
};

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "history", label: "History" },
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
  { id: "pending", label: "Pending" },
];

function filterReferrals(list: DoctorReferral[], tab: FilterTab) {
  if (tab === "sent") return list.filter((r) => r.direction === "sent");
  if (tab === "received") return list.filter((r) => r.direction === "received");
  if (tab === "pending") return list.filter((r) => r.status === "Pending");
  if (tab === "history") return list.filter((r) => r.status !== "Pending");
  return list;
}

function canRespondToReferral(referral: DoctorReferral) {
  return referral.direction === "received" && referral.status === "Pending";
}

function ReferralAcceptRejectBar({
  onAccept,
  onReject,
  compact,
}: {
  onAccept: () => void;
  onReject: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", compact ? "pt-0" : undefined)}>
      <button
        type="button"
        onClick={onReject}
        className={cn(
          "flex-1 rounded-xl border border-[#E8E4DF] font-semibold text-[#8A8F8C]",
          compact ? "py-2 text-xs" : "py-3 text-sm",
        )}
      >
        Reject
      </button>
      <button
        type="button"
        onClick={onAccept}
        className={cn(
          "flex-1 rounded-xl bg-[#1B3B2E] font-semibold text-white",
          compact ? "py-2 text-xs" : "py-3 text-sm",
        )}
      >
        Accept
      </button>
    </div>
  );
}

function ReferralDetailBody({
  ref: referral,
  onAccept,
  onReject,
  onOpenDocument,
}: {
  ref: DoctorReferral;
  onAccept?: () => void;
  onReject?: () => void;
  onOpenDocument?: () => void;
}) {
  const Icon = referral.direction === "sent" ? Send : Inbox;
  const iconBg = referral.direction === "sent" ? "#E8EFE6" : "#F0DDD6";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-[#8A8F8C]">
            {referral.direction === "sent" ? "OUTGOING" : "INCOMING"} · {referral.specialty.toUpperCase()}
          </p>
          <h2 className="font-serif text-xl font-semibold text-[#1B3B2E]">{referral.patientName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", STATUS_STYLE[referral.status])}>
              {referral.status}
            </span>
            <span className="text-xs text-[#8A8F8C]">
              {referral.relativeTime} · {referral.absoluteTime}
            </span>
          </div>
        </div>
      </div>

      {canRespondToReferral(referral) && onAccept && onReject && (
        <ReferralAcceptRejectBar onAccept={onAccept} onReject={onReject} />
      )}

      <ProfileSectionCard title="Clinical reason">
        <p className="text-sm leading-relaxed text-[#1B3B2E]">{referral.clinicalReason}</p>
      </ProfileSectionCard>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-[#EDEAE6] bg-white p-4">
          <p className="text-[10px] font-semibold tracking-wide text-[#8A8F8C]">TO</p>
          <p className="mt-1 font-semibold text-[#1B3B2E]">{referral.specialty}</p>
        </div>
        <div className="rounded-[18px] border border-[#EDEAE6] bg-white p-4">
          <p className="text-[10px] font-semibold tracking-wide text-[#8A8F8C]">FROM</p>
          <p className="mt-1 font-semibold text-[#1B3B2E]">{referral.fromDoctor}</p>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#EDEAE6] bg-white p-4">
        <p className="text-[10px] font-semibold tracking-wide text-[#8A8F8C]">FACILITY</p>
        <p className="mt-1 text-sm font-medium text-[#1B3B2E]">{referral.facility}</p>
      </div>

      <button
        type="button"
        onClick={onOpenDocument}
        className="w-full rounded-[18px] border border-[#EDEAE6] bg-white p-4 text-left transition-colors hover:border-[#B8735D]/40 hover:bg-[#FAF9F7]"
      >
        <p className="text-[10px] font-semibold tracking-wide text-[#8A8F8C]">LINKED DOCUMENT</p>
        <p className="mt-1 text-sm font-semibold text-[#B8735D]">{referral.linkedDocument} →</p>
      </button>

      <ProfileSectionCard
        id="referral-history"
        title="Referral history"
        hint="Handoff & response trail"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-[#1B3B2E]">Referral history</span>
          </div>
          <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-[#E8EFE6] px-2 text-xs font-bold text-[#1B3B2E]">
            {referral.history.length}
          </span>
        </div>
        <ol className="relative space-y-4 border-l-2 border-[#EDEAE6] pl-5">
          {referral.history.map((event) => (
            <li key={event.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full",
                  event.isLatest ? "bg-[#B8735D]" : "bg-[#D4D0CB]",
                )}
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-[#1B3B2E]">{event.title}</p>
                <p className="text-[10px] text-[#8A8F8C]">
                  {event.relativeTime} · {event.absoluteTime}
                </p>
              </div>
              <p className="text-sm text-[#8A8F8C]">{event.actor}</p>
              {event.detail && <p className="text-xs text-[#8A8F8C]">{event.detail}</p>}
            </li>
          ))}
        </ol>
      </ProfileSectionCard>
    </div>
  );
}

function ReferralCard({
  referral,
  selected,
  onOpen,
  onAccept,
  onReject,
}: {
  referral: DoctorReferral;
  selected?: boolean;
  onOpen: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const Icon = referral.direction === "sent" ? Send : Inbox;
  const iconBg = referral.direction === "sent" ? "#E8EFE6" : "#F0DDD6";
  const showActions = canRespondToReferral(referral) && onAccept && onReject;

  return (
    <div
      className={cn(
        "block w-full overflow-hidden rounded-[20px] border bg-white text-left shadow-[0_2px_14px_rgba(27,59,46,0.05)] transition-shadow hover:shadow-md",
        selected ? "border-[#B8735D] ring-2 ring-[#B8735D]/20" : "border-[#EDEAE6]",
      )}
    >
      <button type="button" onClick={() => onOpen(referral.id)} className="block w-full text-left active:scale-[0.99]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#1B3B2E]">{referral.patientName}</p>
                <p className="text-xs text-[#8A8F8C]">{referral.facility}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  STATUS_STYLE[referral.status],
                )}
              >
                {referral.status}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-[#1B3B2E]">{referral.clinicalReason}</p>
            <p className="mt-1 text-xs text-[#8A8F8C]">
              {referral.direction === "sent" ? "To" : "From"} {referral.specialty} · From{" "}
              {referral.fromDoctor}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8A8F8C]">
          {referral.status === "Pending" ? (
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <Check className="h-3.5 w-3.5 text-[#7A9B7E]" strokeWidth={1.75} />
          )}
          <span>{referral.statusDetail}</span>
        </div>
      </div>
      </button>
      {showActions && (
        <div
          className="border-t border-[#F0EDE8] bg-[#FAFAF8] px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ReferralAcceptRejectBar
            compact
            onAccept={() => onAccept(referral.id)}
            onReject={() => onReject(referral.id)}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => onOpen(referral.id)}
        className="w-full border-t border-[#F0EDE8] bg-[#FAFAF8] px-4 py-3 text-center text-xs font-semibold text-[#1B3B2E] hover:bg-[#F5F3F0]"
      >
        Tap for full referral history
      </button>
    </div>
  );
}

function useIsMobileBelowLg() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

/** Unified referrals list + detail (sheet on mobile, split pane on desktop). */
export function DoctorReferralsWorkspace({
  selectedReferralId,
  backTo = "/doctor/settings",
}: {
  selectedReferralId?: string;
  backTo?: string;
}) {
  const store = useProfileStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>("all");
  const [newOpen, setNewOpen] = useState(false);
  /** Opens sheet immediately even before URL search updates. */
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedReferralId);
  const [patientId, setPatientId] = useState(PANEL_PATIENTS[0]?.id ?? "");
  const [patientQuery, setPatientQuery] = useState("");
  const [specialty, setSpecialty] = useState("Cardiology");
  const [reason, setReason] = useState("");
  const [facility, setFacility] = useState("");

  const isMobileLayout = useIsMobileBelowLg();
  const activeReferralId = selectedReferralId ?? localSelectedId;
  /** Sheet + dark overlay only on mobile — desktop uses the split pane. */
  const mobileSheetOpen = Boolean(activeReferralId && isMobileLayout);
  useDoctorMobileOverlay(mobileSheetOpen);

  useEffect(() => {
    setLocalSelectedId(selectedReferralId);
  }, [selectedReferralId]);

  useEffect(() => {
    if (!activeReferralId) return undefined;
    const targetId = isMobileLayout ? "referral-history" : "referral-history-desktop";
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, isMobileLayout ? 320 : 80);
    return () => window.clearTimeout(timer);
  }, [activeReferralId, isMobileLayout]);

  const awaiting = referralsAwaitingCount();
  const filtered = useMemo(() => filterReferrals(store.referrals, tab), [store.referrals, tab]);

  const selectedReferral =
    activeReferralId != null
      ? store.referrals.find((r) => r.id === activeReferralId) ?? getReferralById(activeReferralId)
      : undefined;

  const openReferral = (id: string) => {
    setLocalSelectedId(id);
    navigate({ to: "/doctor/settings/referrals", search: { id } });
  };

  const closeReferral = () => {
    setLocalSelectedId(undefined);
    navigate({ to: "/doctor/settings/referrals", search: {} });
  };

  const openDocument = () => {
    navigate({ to: "/doctor/reports" });
    toast.message("Opening linked document in Inbox");
  };

  const patientOptions = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return PANEL_PATIENTS.slice(0, 8);
    return PANEL_PATIENTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [patientQuery]);

  const selectedPatient = PANEL_PATIENTS.find((p) => p.id === patientId);

  const sendReferral = () => {
    const patientName = selectedPatient?.name ?? patientQuery.trim();
    if (!patientName) {
      toast.error("Select a patient");
      return;
    }
    if (!reason.trim()) {
      toast.error("Clinical reason is required");
      return;
    }
    if (!facility.trim()) {
      toast.error("Receiving facility is required");
      return;
    }
    const created = addReferral({
      patientName,
      specialty,
      clinicalReason: reason.trim(),
      facility: facility.trim(),
      linkedDocument: "Clinical note",
    });
    toast.success("Referral sent with document", {
      description: `${patientName} → ${specialty}`,
    });
    setNewOpen(false);
    setReason("");
    setFacility("");
    const newId = created.referrals[0]?.id;
    if (newId) openReferral(newId);
  };

  const handleAccept = (id?: string) => {
    const referralId = id ?? activeReferralId;
    if (!referralId) return;
    acceptReferral(referralId);
    toast.success("Referral accepted");
  };

  const handleReject = (id?: string) => {
    const referralId = id ?? activeReferralId;
    if (!referralId) return;
    declineReferral(referralId);
    toast.message("Referral rejected");
  };

  const showDesktopDetail = Boolean(activeReferralId && selectedReferral);

  return (
    <>
      <DoctorProfileSubpage
        title="Referrals"
        subtitle={`${awaiting} awaiting action`}
        backTo={backTo}
        breadcrumbs={[
          { label: "Profile", to: "/doctor/settings" },
          { label: "Referrals" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3.5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New
          </button>
        }
        contentClassName={
          showDesktopDetail
            ? "lg:grid lg:grid-cols-[minmax(300px,380px)_1fr] lg:items-start lg:gap-6 lg:space-y-0"
            : undefined
        }
      >
        <div
          className={cn(
            showDesktopDetail &&
              "lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1",
          )}
        >
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTab(f.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  tab === f.id
                    ? "bg-[#1B3B2E] text-white"
                    : "border border-[#E8E4DF] bg-white text-[#8A8F8C]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="mt-3 space-y-3">
            {filtered.length === 0 ? (
              <ProfileEmptyState
                title="No referrals in this view"
                description="Try another filter or create a new specialist referral."
                action={
                  <button
                    type="button"
                    onClick={() => setNewOpen(true)}
                    className="rounded-xl bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white"
                  >
                    + New referral
                  </button>
                }
              />
            ) : (
              filtered.map((ref) => (
                <li key={ref.id}>
                  <ReferralCard
                    referral={ref}
                    selected={activeReferralId === ref.id}
                    onOpen={openReferral}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                </li>
              ))
            )}
          </ul>
        </div>

        {showDesktopDetail && selectedReferral && (
          <div id="referral-history-desktop" className="hidden lg:block">
            <div className="rounded-[22px] border border-[#EDEAE6] bg-white p-5 shadow-sm">
              <ReferralDetailBody
                ref={selectedReferral}
                onAccept={() => handleAccept()}
                onReject={() => handleReject()}
                onOpenDocument={openDocument}
              />
            </div>
          </div>
        )}
      </DoctorProfileSubpage>

      {/* Mobile only: bottom sheet over list (no overlay on desktop) */}
      {isMobileLayout && (
        <Sheet
          open={mobileSheetOpen}
          onOpenChange={(open) => {
            if (!open) closeReferral();
          }}
        >
          <SheetContent
            side="bottom"
            className="flex max-h-[92dvh] flex-col rounded-t-[28px] border-[#E8E4DF] bg-[#F7F5F2] px-0 pb-8 pt-3 [&>button]:hidden"
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-[#E8E4DF]" />
            {selectedReferral ? (
              <div className="flex-1 overflow-y-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ReferralDetailBody
                  ref={selectedReferral}
                  onAccept={() => handleAccept()}
                  onReject={() => handleReject()}
                  onOpenDocument={openDocument}
                />
              </div>
            ) : (
              <ProfileEmptyState
                title="Referral not found"
                description="This referral may have been removed."
                action={
                  <button
                    type="button"
                    onClick={closeReferral}
                    className="rounded-xl bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Back to list
                  </button>
                }
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] rounded-t-[28px] border-[#E8E4DF] bg-white px-0 pb-8 pt-3 lg:mx-auto lg:max-w-lg lg:rounded-[28px] [&>button]:hidden"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E4DF] lg:hidden" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="font-serif text-xl font-semibold text-[#1B3B2E]">
              Specialist referral
            </SheetTitle>
            <p className="text-sm text-[#8A8F8C]">
              The report stays open behind this form. Referral is sent in-network only.
            </p>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto px-5 pb-2">
            <label className="block">
              <span className="text-xs font-semibold text-[#8A8F8C]">Patient</span>
              <input
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Search panel patients…"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] px-3.5 text-sm outline-none focus:border-[#B8735D]/50"
              />
              {patientOptions.length > 0 && (
                <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-[#EDEAE6] bg-[#FAFAF8] p-1">
                  {patientOptions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientQuery(p.name);
                        }}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm",
                          patientId === p.id
                            ? "bg-[#E8EFE6] font-semibold text-[#1B3B2E]"
                            : "text-[#1B3B2E] hover:bg-white",
                        )}
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </label>
            <div>
              <span className="text-xs font-semibold text-[#8A8F8C]">Specialty</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {REFERRAL_SPECIALTIES.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpecialty(s)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                      specialty === s
                        ? "border-[#1B3B2E] bg-[#E8EFE6] text-[#1B3B2E]"
                        : "border-[#E8E4DF] bg-white text-[#8A8F8C]",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-[#E8E4DF] px-3.5 text-sm outline-none"
              />
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-[#8A8F8C]">Clinical reason</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-[#E8E4DF] px-3.5 py-2.5 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#8A8F8C]">Receiving facility</span>
              <input
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] px-3.5 text-sm outline-none"
              />
            </label>
            <button
              type="button"
              onClick={sendReferral}
              className="w-full rounded-xl bg-[#1B3B2E] py-3.5 text-sm font-semibold text-white"
            >
              Send referral with document
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** @deprecated Use DoctorReferralsWorkspace */
export function DoctorReferralsScreen(props: { selectedId?: string; backTo?: string }) {
  return <DoctorReferralsWorkspace selectedReferralId={props.selectedId} backTo={props.backTo} />;
}

export function DoctorReferralDetailScreen({
  referralId,
  backTo = "/doctor/settings",
}: {
  referralId: string;
  backTo?: string;
}) {
  return <DoctorReferralsWorkspace selectedReferralId={referralId} backTo={backTo} />;
}

import { useEffect, useState } from "react";
import { Bell, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { DoctorProfileSubpage, ProfileSectionCard } from "./DoctorProfileSubpage";
import {
  AWAY_REASONS,
  COVERING_DOCTORS,
  TODAY_PATIENTS_AWAY,
  type AwayReason,
} from "@/lib/doctor-profile-workspace";
import {
  activateAway,
  clearAwayMode,
  getAwayMessageForReason,
  updateAway,
} from "@/lib/doctor-profile-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { setAccepting } from "@/lib/doctor-live-queue";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { cn } from "@/lib/utils";

export function DoctorEmergencyAwayScreen() {
  const store = useProfileStore();
  const { refresh } = useLiveQueue();
  const [reason, setReason] = useState<AwayReason>(store.away.reason);
  const [message, setMessage] = useState(store.away.message);
  const [pauseBookings, setPauseBookings] = useState(store.away.pauseBookings);
  const [selectedPatients, setSelectedPatients] = useState<string[]>(
    store.away.selectedPatients.length > 0
      ? store.away.selectedPatients
      : TODAY_PATIENTS_AWAY.map((p) => p.id),
  );
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (store.away.active) {
      setReason(store.away.reason);
      setMessage(store.away.message);
      setPauseBookings(store.away.pauseBookings);
    }
  }, [store.away.active, store.away.reason, store.away.message, store.away.pauseBookings]);

  const togglePatient = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearPatients = () => setSelectedPatients([]);

  const selectReason = (id: AwayReason) => {
    setReason(id);
    const template = getAwayMessageForReason(id);
    setMessage(template);
    updateAway({ reason: id, message: template });
  };

  const validate = () => {
    if (selectedPatients.length === 0) {
      toast.error("Select at least one patient");
      return false;
    }
    if (selectedDoctors.length === 0) {
      toast.error("Select covering doctors");
      return false;
    }
    if (!message.trim()) {
      toast.error("Patient message is required");
      return false;
    }
    return true;
  };

  const sendRequests = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const confirmSend = () => {
    activateAway({
      reason,
      message: message.trim(),
      pauseBookings,
      patientIds: selectedPatients,
      doctorIds: selectedDoctors,
    });
    if (pauseBookings) {
      setAccepting(false);
      refresh();
    }
    setConfirmOpen(false);
    toast.success("Coverage requests sent", {
      description: `${selectedDoctors.length} colleague(s) notified`,
    });
  };

  const endAway = () => {
    clearAwayMode();
    setAccepting(true);
    refresh();
    toast.message("You're back on duty");
  };

  const reasonSection = (
    <ProfileSectionCard title="Why are you away?">
      <ul className="space-y-2">
        {AWAY_REASONS.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => selectReason(option.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40",
                reason === option.id
                  ? "border-[#1B3B2E] bg-[#F5F2ED]"
                  : "border-[#EDEAE6] bg-[#FAFAF8]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  reason === option.id
                    ? "border-[#1B3B2E] bg-[#1B3B2E]"
                    : "border-[#D4D0CB]",
                )}
              >
                {reason === option.id && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <div>
                <p className="font-semibold text-[#1B3B2E]">{option.label}</p>
                <p className="text-xs text-[#8A8F8C]">{option.hint}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </ProfileSectionCard>
  );

  const messageSection = (
    <ProfileSectionCard title="Message to patients">
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          updateAway({ message: e.target.value });
        }}
        rows={4}
        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FAFAF8] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#B8735D]/50"
      />
    </ProfileSectionCard>
  );

  const pauseSection = (
    <ProfileSectionCard>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-[#8A8F8C]" strokeWidth={1.75} />
          <p className="text-sm font-medium text-[#1B3B2E]">Pause new bookings while away</p>
        </div>
        <Switch
          checked={pauseBookings}
          onCheckedChange={(v) => {
            setPauseBookings(v);
            updateAway({ pauseBookings: v });
          }}
          className="data-[state=checked]:bg-[#7A9B7E]"
        />
      </div>
    </ProfileSectionCard>
  );

  const patientsSection = (
    <ProfileSectionCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1B3B2E]">Today&apos;s patients</h3>
        <button
          type="button"
          onClick={clearPatients}
          className="text-xs font-semibold text-[#C45C4A]"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-2">
        {TODAY_PATIENTS_AWAY.map((patient) => {
          const checked = selectedPatients.includes(patient.id);
          return (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => togglePatient(patient.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#EDEAE6] bg-[#FAFAF8] p-3.5 text-left"
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md",
                    checked ? "bg-[#1B3B2E] text-white" : "border-2 border-[#D4D0CB]",
                  )}
                >
                  {checked && <span className="text-xs">✓</span>}
                </span>
                <div>
                  <p className="font-semibold text-[#1B3B2E]">{patient.name}</p>
                  <p className="text-xs text-[#8A8F8C]">
                    {patient.time} · {patient.mode} · {patient.status}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </ProfileSectionCard>
  );

  const doctorsSection = (
    <ProfileSectionCard
      title="Covering doctors"
      hint="Select multiple doctors — they must accept before patients are notified"
    >
      <ul className="space-y-2">
        {COVERING_DOCTORS.map((doc) => {
          const checked = selectedDoctors.includes(doc.id);
          return (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => toggleDoctor(doc.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                  checked ? "border-[#1B3B2E] bg-[#F5F2ED]" : "border-[#EDEAE6] bg-white",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EDEAE6] text-sm font-semibold text-[#1B3B2E]">
                  {doc.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1B3B2E]">{doc.name}</p>
                  <p className="text-xs text-[#8A8F8C]">
                    {doc.specialty} · {doc.room}
                  </p>
                </div>
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md",
                    checked ? "bg-[#1B3B2E] text-white" : "border-2 border-[#D4D0CB]",
                  )}
                >
                  {checked && <span className="text-xs">✓</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ProfileSectionCard>
  );

  return (
    <DoctorProfileSubpage
      title="Emergency / away"
      subtitle={
        store.away.active
          ? "Away mode active — colleagues notified"
          : "Reassign patients & notify them"
      }
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Emergency / away" },
      ]}
      action={
        store.away.active ? (
          <button
            type="button"
            onClick={endAway}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E4DF] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1B3B2E]"
          >
            <RotateCcw className="h-4 w-4" />
            End away
          </button>
        ) : undefined
      }
    >
      {store.away.active && (
        <div className="rounded-xl border border-[#F5E6B8] bg-[#FDF8EB] px-4 py-3 text-sm text-[#5C4A1E]">
          Coverage active since{" "}
          {store.away.sentAt
            ? new Date(store.away.sentAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "recently"}
          . Check{" "}
          <a href="/doctor/settings/notifications" className="font-semibold text-[#B8735D] underline">
            notifications
          </a>{" "}
          for colleague responses.
        </div>
      )}

      {/* Mobile wizard steps */}
      <div className="flex gap-2 lg:hidden">
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={cn(
              "flex-1 rounded-full py-2 text-xs font-semibold",
              step === s ? "bg-[#1B3B2E] text-white" : "bg-white text-[#8A8F8C] border border-[#E8E4DF]",
            )}
          >
            {s === 1 ? "Why" : s === 2 ? "Patients" : "Cover"}
          </button>
        ))}
      </div>

      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className={cn("space-y-5", step !== 1 && "hidden lg:block")}>
          {reasonSection}
          {messageSection}
          {pauseSection}
        </div>

        <div className={cn("space-y-5", step === 2 ? "block" : "hidden lg:block", step === 3 && "lg:block")}>
          <div className={cn(step !== 2 && step !== 3 && "hidden lg:block")}>{patientsSection}</div>
          <div className={cn(step !== 3 && "hidden lg:block")}>{doctorsSection}</div>

          <button
            type="button"
            onClick={sendRequests}
            disabled={store.away.active}
            className="w-full rounded-2xl bg-[#C45C4A] py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-50 lg:sticky lg:bottom-4"
          >
            Send coverage requests
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send coverage requests?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-[#8A8F8C]">
                <p>
                  <strong className="text-[#1B3B2E]">{selectedPatients.length}</strong> patient(s)
                  will be offered to{" "}
                  <strong className="text-[#1B3B2E]">{selectedDoctors.length}</strong> colleague(s).
                </p>
                <p className="rounded-lg bg-[#FAFAF8] p-3 text-[#1B3B2E]">{message}</p>
                {pauseBookings && (
                  <p className="text-[#C45C4A]">New bookings will be paused until you return.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSend}
              className="bg-[#C45C4A] hover:bg-[#B04A3A]"
            >
              Send requests
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DoctorProfileSubpage>
  );
}

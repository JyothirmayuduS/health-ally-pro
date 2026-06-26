import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { usePatientSheetA11y } from "@/hooks/usePatientSheetA11y";
import { addDependent } from "@/lib/dependents-store";
import type { DependentRelation } from "@/lib/patient-profile-data";
import type { QueuePersona } from "@/lib/patient-queue";
import { cn } from "@/lib/utils";

const RELATIONS: DependentRelation[] = ["Child", "Parent", "Spouse", "Other"];

const CHILD_PERSONAS: { label: string; persona: QueuePersona }[] = [
  { label: "Girl", persona: "girl" },
  { label: "Boy", persona: "boy" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddDependentSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [relation, setRelation] = useState<DependentRelation>("Child");
  const [childPersona, setChildPersona] = useState<QueuePersona>("girl");
  const panelRef = useRef<HTMLDivElement>(null);
  const { titleId } = usePatientSheetA11y({
    open,
    onClose,
    panelRef,
    initialFocusSelector: "input",
  });

  useEffect(() => {
    if (!open) {
      setName("");
      setAge("");
      setBloodGroup("");
      setRelation("Child");
      setChildPersona("girl");
    }
  }, [open]);

  if (!open) return null;

  const ageNum = parseInt(age, 10);
  const canSubmit = name.trim().length > 0 && ageNum > 0 && ageNum < 120;

  function handleSubmit() {
    if (!canSubmit) return;
    const dep = addDependent({
      name: name.trim(),
      relation,
      age: ageNum,
      bloodGroup: bloodGroup.trim() || undefined,
      persona: relation === "Child" ? childPersona : undefined,
    });
    toast.success("Profile created", {
      description: `${dep.name} is ready — add clinical details at your next visit.`,
    });
    onClose();
    navigate({
      to: "/profile/dependents/$dependentId",
      params: { dependentId: dep.id },
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F9F7F2] shadow-2xl lg:max-w-md lg:rounded-[28px]"
      >
        <div className="flex shrink-0 justify-center pt-3 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-[#D8D4CE]" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-2 lg:px-6 lg:pt-6">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              <UserPlus className="h-3.5 w-3.5" />
              Family network
            </p>
            <h2 id={titleId} className="mt-1 font-serif text-[26px] text-ink">
              Add dependent
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 lg:px-6">
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-ink">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Thorne"
              className="w-full rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Age</span>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="7"
                className="w-full rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Blood group</span>
              <input
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="A+"
                className="w-full rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
              />
            </label>
          </div>

          <div className="mb-4">
            <span className="mb-2 block text-sm font-semibold text-ink">Relationship</span>
            <div className="flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelation(r)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                    relation === r
                      ? "border-ink bg-ink text-white"
                      : "border-[#EDEAE6] bg-white text-ink-muted",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {relation === "Child" ? (
            <div className="mb-6">
              <span className="mb-2 block text-sm font-semibold text-ink">Profile icon</span>
              <div className="flex gap-2">
                {CHILD_PERSONAS.map(({ label, persona }) => (
                  <button
                    key={persona}
                    type="button"
                    onClick={() => setChildPersona(persona)}
                    className={cn(
                      "flex-1 rounded-2xl border py-2.5 text-sm font-medium transition-colors",
                      childPersona === persona
                        ? "border-ink bg-ink text-white"
                        : "border-[#EDEAE6] bg-white text-ink-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6" />
          )}
        </div>

        <div className="shrink-0 border-t border-[#EDEAE6] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-35"
          >
            Create medical profile
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

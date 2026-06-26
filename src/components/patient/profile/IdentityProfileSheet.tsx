import { Camera, Check, Mail, Pencil, Shield, User, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePatientSheetA11y } from "@/hooks/usePatientSheetA11y";
import { PATIENT_IDENTITY } from "@/lib/patient-profile-data";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function IdentityProfileSheet({ open, onClose }: Props) {
  const [name, setName] = useState(PATIENT_IDENTITY.name);
  const [email, setEmail] = useState(PATIENT_IDENTITY.email);
  const [phone, setPhone] = useState(PATIENT_IDENTITY.phone);
  const panelRef = useRef<HTMLDivElement>(null);

  usePatientSheetA11y({
    open,
    onClose,
    panelRef,
    titleId: "identity-profile-title",
    initialFocusSelector: "button",
  });

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed inset-0 z-[100] flex flex-col bg-[#F9F7F2]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-profile-title"
    >
      <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-ink" />
        </button>
        <h1 id="identity-profile-title" className="font-serif text-xl text-ink">
          Identity Profile
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white"
          aria-label="Save"
        >
          <Check className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8 sm:px-6">
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <span className="grid h-28 w-28 place-items-center rounded-full bg-[#EDEAE6] font-serif text-4xl text-ink-muted">
              {PATIENT_IDENTITY.initials}
            </span>
            <button
              type="button"
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-[#F9F7F2] bg-white shadow-sm"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4 text-ink-muted" />
            </button>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            Patient ID: {PATIENT_IDENTITY.patientId}
          </p>
          <p className="mt-1 font-serif text-2xl text-clay">Identity Verified</p>
        </div>

        <div className="mb-6 rounded-2xl bg-clay/15 px-4 py-3.5 text-center text-sm text-clay">
          <Shield className="mx-auto mb-1.5 h-4 w-4" strokeWidth={1.75} />
          Securely linked to Primary Care Provider
        </div>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
          Personal identity
        </p>
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white">
          <label className="flex items-center gap-3 border-b border-[#EDEAE6] px-4 py-3.5">
            <User className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
            />
            <Pencil className="h-3.5 w-3.5 text-ink-muted" />
          </label>
          <label className="flex items-center gap-3 px-4 py-3.5">
            <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
            />
            <Pencil className="h-3.5 w-3.5 text-ink-muted" />
          </label>
        </div>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
          Contact information
        </p>
        <div className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white">
          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-sm text-ink-muted">📞</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
            />
            <Pencil className="h-3.5 w-3.5 text-ink-muted" />
          </label>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-muted">
          Medora uses end-to-end encryption. Changing your identity profile requires
          re-verification by your care team.
        </p>
      </div>
    </div>,
    document.body,
  );
}

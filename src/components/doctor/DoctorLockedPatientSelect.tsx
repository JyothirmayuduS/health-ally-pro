import { cn } from "@/lib/utils";
import { useDoctorPatientContextLock } from "@/hooks/useDoctorPatientContextLock";

type Option = { id: string; name: string };

type Props = {
  label?: string;
  value: string;
  options: Option[];
  /** Explicit lock from route search; falls back to active ?patientId= in URL. */
  lockedPatientId?: string;
  lockedLabel?: string;
  onChange: (id: string) => void;
  className?: string;
  autoLockFromRoute?: boolean;
};

/** Locks patient picker when deep-linked via ?patientId= on the current route. */
export function DoctorLockedPatientSelect({
  label = "Patient",
  value,
  options,
  lockedPatientId,
  lockedLabel,
  onChange,
  className,
  autoLockFromRoute = true,
}: Props) {
  const routeLock = useDoctorPatientContextLock(
    autoLockFromRoute ? lockedPatientId : undefined,
  );
  const effectiveLockId = lockedPatientId ?? (autoLockFromRoute ? routeLock.lockedPatientId : undefined);
  const locked = Boolean(effectiveLockId);
  const selected = options.find((p) => p.id === value);

  if (locked) {
    return (
      <div className={className}>
        <span className="block text-xs font-semibold uppercase text-[#8A8F8C]">{label}</span>
        <div
          className="mt-1 flex min-h-[48px] items-center rounded-2xl border border-[#E8E4DF] bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#1B3B2E]"
          aria-disabled="true"
          aria-label={`Patient locked: ${lockedLabel ?? routeLock.lockedPatientName ?? selected?.name ?? "Selected patient"}`}
          title="Patient context locked — ?patientId= active on this route"
        >
          {lockedLabel ?? routeLock.lockedPatientName ?? selected?.name ?? "Selected patient"}
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
            Locked
          </span>
        </div>
      </div>
    );
  }

  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold uppercase text-[#8A8F8C]">{label}</span>
      <select
        className="mt-1 w-full min-h-[48px] rounded-2xl border border-[#E8E4DF] px-4 py-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Select ${label.toLowerCase()}`}
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

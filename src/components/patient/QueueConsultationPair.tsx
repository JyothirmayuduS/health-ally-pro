import type { DoctorGender } from "@/lib/doctor-gender";
import type { QueuePersona } from "@/lib/patient-queue";
import {
  DOCTOR_QUEUE_IMAGES,
  DOCTOR_QUEUE_INVERT,
  personaImageNeedsInvert,
  QUEUE_PERSONA_IMAGES,
} from "@/lib/queue-persona-assets";
import { QueueBustAvatar } from "@/components/patient/QueueBustAvatar";
import { cn } from "@/lib/utils";

type Props = {
  patient: QueuePersona;
  doctorGender: DoctorGender;
  className?: string;
};

export function QueueConsultationPair({ patient, doctorGender, className }: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-2xl border border-emerald-200/70 bg-white px-2.5 py-2 shadow-sm",
        className,
      )}
      aria-label="Patient in consultation with doctor"
    >
      <QueueBustAvatar
        src={QUEUE_PERSONA_IMAGES[patient]}
        role="patient"
        size="sm"
        invert={personaImageNeedsInvert(patient)}
      />
      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        With
      </span>
      <QueueBustAvatar
        src={DOCTOR_QUEUE_IMAGES[doctorGender]}
        role="doctor"
        size="sm"
        invert={DOCTOR_QUEUE_INVERT}
      />
    </div>
  );
}

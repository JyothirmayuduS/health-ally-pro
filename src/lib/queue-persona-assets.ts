import type { QueuePersona } from "@/lib/patient-queue";
import type { DoctorGender } from "@/lib/doctor-gender";
import adultMan from "@/assets/queue-personas/adult-man.png";
import adultWoman from "@/assets/queue-personas/adult-woman.png";
import boy from "@/assets/queue-personas/boy.png";
import girl from "@/assets/queue-personas/girl.png";
import elderlyMan from "@/assets/queue-personas/elderly-man.png";
import elderlyWoman from "@/assets/queue-personas/elderly-woman.png";
import doctorMan from "@/assets/queue-personas/doctor-man.png";
import doctorWoman from "@/assets/queue-personas/doctor-woman.png";

export const QUEUE_PERSONA_IMAGES: Record<QueuePersona, string> = {
  "adult-man": adultMan,
  "adult-woman": adultWoman,
  boy,
  girl,
  "elderly-man": elderlyMan,
  "elderly-woman": elderlyWoman,
};

export const DOCTOR_QUEUE_IMAGES: Record<DoctorGender, string> = {
  male: doctorMan,
  female: doctorWoman,
};

/** White line-art PNGs need invert on light circles; black line-art does not */
export const QUEUE_PERSONA_INVERT: Record<QueuePersona, boolean> = {
  "adult-man": false,
  "adult-woman": true,
  boy: true,
  girl: true,
  "elderly-man": true,
  "elderly-woman": true,
};

export const DOCTOR_QUEUE_INVERT = true;

export const QUEUE_PERSONA_LABELS: Record<QueuePersona, string> = {
  "elderly-man": "Elderly man",
  "elderly-woman": "Elderly woman",
  "adult-man": "Adult man",
  "adult-woman": "Adult woman",
  boy: "Boy",
  girl: "Girl",
};

export function personaImageNeedsInvert(persona: QueuePersona): boolean {
  return QUEUE_PERSONA_INVERT[persona];
}

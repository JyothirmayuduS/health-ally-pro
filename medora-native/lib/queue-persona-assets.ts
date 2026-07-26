import type { QueuePersona } from "@/lib/patient-queue";
import type { DoctorGender } from "@/lib/doctor-gender";
import type { ImageSourcePropType } from "react-native";

import adultManImage from "@/assets/queue-personas/adult-man.png";
import adultWomanImage from "@/assets/queue-personas/adult-woman.png";
import boyImage from "@/assets/queue-personas/boy.png";
import girlImage from "@/assets/queue-personas/girl.png";
import elderlyManImage from "@/assets/queue-personas/elderly-man.png";
import elderlyWomanImage from "@/assets/queue-personas/elderly-woman.png";
import doctorManImage from "@/assets/queue-personas/doctor-man.png";
import doctorWomanImage from "@/assets/queue-personas/doctor-woman.png";

export const QUEUE_PERSONA_IMAGES: Record<QueuePersona, ImageSourcePropType> = {
  "adult-man": adultManImage,
  "adult-woman": adultWomanImage,
  boy: boyImage,
  girl: girlImage,
  "elderly-man": elderlyManImage,
  "elderly-woman": elderlyWomanImage,
};

export const DOCTOR_QUEUE_IMAGES: Record<DoctorGender, ImageSourcePropType> = {
  male: doctorManImage,
  female: doctorWomanImage,
};

export const QUEUE_PERSONA_LABELS: Record<QueuePersona, string> = {
  "elderly-man": "Elderly man",
  "elderly-woman": "Elderly woman",
  "adult-man": "Adult man",
  "adult-woman": "Adult woman",
  boy: "Boy",
  girl: "Girl",
};

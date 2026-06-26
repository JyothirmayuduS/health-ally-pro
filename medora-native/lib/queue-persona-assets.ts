import type { QueuePersona } from "@/lib/patient-queue";
import type { DoctorGender } from "@/lib/doctor-gender";
import type { ImageSourcePropType } from "react-native";

export const QUEUE_PERSONA_IMAGES: Record<QueuePersona, ImageSourcePropType> = {
  "adult-man": require("@/assets/queue-personas/adult-man.png"),
  "adult-woman": require("@/assets/queue-personas/adult-woman.png"),
  boy: require("@/assets/queue-personas/boy.png"),
  girl: require("@/assets/queue-personas/girl.png"),
  "elderly-man": require("@/assets/queue-personas/elderly-man.png"),
  "elderly-woman": require("@/assets/queue-personas/elderly-woman.png"),
};

export const DOCTOR_QUEUE_IMAGES: Record<DoctorGender, ImageSourcePropType> = {
  male: require("@/assets/queue-personas/doctor-man.png"),
  female: require("@/assets/queue-personas/doctor-woman.png"),
};

export const QUEUE_PERSONA_LABELS: Record<QueuePersona, string> = {
  "elderly-man": "Elderly man",
  "elderly-woman": "Elderly woman",
  "adult-man": "Adult man",
  "adult-woman": "Adult woman",
  boy: "Boy",
  girl: "Girl",
};

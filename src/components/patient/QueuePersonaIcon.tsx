import type { QueueNodeKind, QueuePersona } from "@/lib/patient-queue";
import {
  personaImageNeedsInvert,
  QUEUE_PERSONA_IMAGES,
} from "@/lib/queue-persona-assets";
import { QueueBustAvatar } from "@/components/patient/QueueBustAvatar";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md";

type Props = {
  persona: QueuePersona;
  kind?: QueueNodeKind;
  size?: Size;
  plain?: boolean;
  className?: string;
};

export function QueuePersonaIcon({
  persona,
  kind = "waiting",
  size = "sm",
  plain = false,
  className,
}: Props) {
  const isYou = kind === "you";
  const dimmed = !plain && (kind === "completed" || kind === "waiting");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full",
        !plain && isYou && "ring-2 ring-[#B8735D] ring-offset-2 ring-offset-[#1A3629]",
        className,
      )}
    >
      <QueueBustAvatar
        src={QUEUE_PERSONA_IMAGES[persona]}
        role="patient"
        size={isYou && !plain && size === "sm" ? "md" : size}
        invert={personaImageNeedsInvert(persona)}
        dimmed={dimmed && !isYou}
      />
    </span>
  );
}

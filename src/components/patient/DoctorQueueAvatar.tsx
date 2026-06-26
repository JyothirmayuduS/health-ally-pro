import type { DoctorGender } from "@/lib/doctor-gender";
import { DOCTOR_QUEUE_IMAGES } from "@/lib/queue-persona-assets";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const IMG: Record<Size, string> = {
  sm: "h-14 w-11",
  md: "h-[4.5rem] w-14",
  lg: "h-24 w-[4.5rem]",
};

type Props = {
  gender: DoctorGender;
  size?: Size;
  active?: boolean;
  className?: string;
};

export function DoctorQueueAvatar({ gender, size = "md", active = false, className }: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-end justify-center",
        active && "drop-shadow-[0_0_12px_rgba(122,155,126,0.35)]",
        className,
      )}
      aria-hidden
    >
      {active ? (
        <span className="absolute -inset-1 rounded-2xl bg-[#7A9B7E]/10 blur-sm" />
      ) : null}
      <img
        src={DOCTOR_QUEUE_IMAGES[gender]}
        alt=""
        draggable={false}
        className={cn(
          "relative object-contain object-bottom drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
          IMG[size],
        )}
      />
    </span>
  );
}

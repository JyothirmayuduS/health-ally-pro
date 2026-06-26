import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export type QueueAvatarRole = "patient" | "doctor";

type Props = {
  src: string;
  role?: QueueAvatarRole;
  size?: "xs" | "sm" | "md";
  invert?: boolean;
  className?: string;
  dimmed?: boolean;
  showLabel?: boolean;
};

const SHELL: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-8 w-8",
  sm: "h-10 w-10",
  md: "h-12 w-12",
};

const IMG: Record<NonNullable<Props["size"]>, string> = {
  xs: "max-h-[58%] max-w-[58%]",
  sm: "max-h-[62%] max-w-[62%]",
  md: "max-h-[66%] max-w-[66%]",
};

const ROLE_SHELL: Record<QueueAvatarRole, string> = {
  patient: "border-[#E5E0D8] bg-white shadow-sm",
  doctor: "border-[#60A5FA] bg-[#DBEAFE] shadow-sm ring-1 ring-[#3B82F6]/20",
};

export function QueueBustAvatar({
  src,
  role = "patient",
  size = "sm",
  invert = true,
  className,
  dimmed = false,
  showLabel = false,
}: Props) {
  const isDoctor = role === "doctor";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          ROLE_SHELL[role],
          SHELL[size],
          dimmed && "opacity-45",
        )}
        aria-hidden
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "h-auto w-auto object-contain object-center",
            IMG[size],
            invert && "invert",
            isDoctor && "opacity-90",
          )}
        />
        {isDoctor ? (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm">
            <Stethoscope className="h-2.5 w-2.5" strokeWidth={2.25} />
          </span>
        ) : null}
      </span>
      {showLabel ? (
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wider",
            isDoctor ? "text-[#2563EB]" : "text-ink-muted",
          )}
        >
          {isDoctor ? "Doctor" : "Patient"}
        </span>
      ) : null}
    </div>
  );
}

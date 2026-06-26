import type { ExerciseRoutine } from "@/lib/exercise-mock-data";
import { getExerciseImageUrl } from "@/lib/exercise-images";
import { cn } from "@/lib/utils";

type Props = {
  routine: Pick<ExerciseRoutine, "id" | "category" | "name">;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  overlay?: boolean;
};

const SIZE_CLASS = {
  sm: "h-14 w-14 rounded-xl",
  md: "h-20 w-20 rounded-2xl",
  lg: "h-28 w-full rounded-[20px]",
  hero: "h-full min-h-[180px] w-full rounded-[24px]",
} as const;

export function ExerciseRoutineThumbnail({
  routine,
  className,
  size = "md",
  overlay = false,
}: Props) {
  const src = getExerciseImageUrl(routine);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[#EDEAE6]",
        SIZE_CLASS[size],
        className,
      )}
    >
      <img
        src={src}
        alt={`${routine.name} — ${routine.category} exercise`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/15 to-transparent" />
      ) : null}
    </div>
  );
}

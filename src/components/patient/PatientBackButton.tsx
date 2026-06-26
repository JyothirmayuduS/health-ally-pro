import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  fallbackTo: string;
  label?: string;
  className?: string;
  ariaLabel?: string;
};

/** Browser-style back when history exists; otherwise navigates to fallback. */
export function PatientBackButton({
  fallbackTo,
  label,
  className,
  ariaLabel,
}: Props) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      onClick={() => {
        if (canGoBack) {
          router.history.back();
        } else {
          router.navigate({ to: fallbackTo });
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink",
        className,
      )}
      aria-label={ariaLabel ?? (label ? `Back to ${label}` : "Go back")}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function PatientBackIconButton({
  fallbackTo,
  ariaLabel = "Go back",
  className,
}: {
  fallbackTo: string;
  ariaLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      onClick={() => {
        if (canGoBack) {
          router.history.back();
        } else {
          router.navigate({ to: fallbackTo });
        }
      }}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ChevronLeft className="h-5 w-5 text-ink sm:h-6 sm:w-6" strokeWidth={2.25} />
    </button>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Patient medications layout — mobile-first; uses full main column on desktop. */
export function PatientMedShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full text-ink",
        "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

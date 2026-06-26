import type { ReactNode } from "react";
import { PatientHubMobileBar } from "@/components/patient/PatientHubMobileBar";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  widthClass?: string;
};

/** Shared wrapper for patient hub routes — mobile search/menu/notifications bar. */
export function PatientHubLayout({
  children,
  className,
  widthClass = "max-w-5xl",
}: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-12",
        widthClass,
        className,
      )}
    >
      <PatientHubMobileBar />
      {children}
    </div>
  );
}

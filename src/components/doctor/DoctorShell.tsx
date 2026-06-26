import type { CSSProperties } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { DoctorProvider } from "@/lib/doctor-store";
import { LiveQueueProvider } from "@/lib/doctor-live-queue-store";
import {
  DOCTOR_MOBILE_BOTTOM_INSET,
  DOCTOR_MOBILE_BOTTOM_INSET_WITH_FAB,
  DOCTOR_MOBILE_TOP_INSET,
  DoctorMobileChromeProvider,
  shouldHideDoctorClinicalFab,
} from "@/lib/doctor-mobile-chrome";
import { ProfileStoreProvider } from "@/lib/doctor-profile-store-context";
import { DoctorBottomNav, DoctorSideNav } from "./apk/DoctorPortalNav";
import { isDoctorPrescriptionsRoute } from "./DoctorClinicStatusBar";
import { DoctorClinicalToolsFab } from "./DoctorClinicalToolsFab";
import { DoctorCommandPalette } from "./DoctorCommandPalette";
import { DoctorKeyboardShortcuts } from "./DoctorKeyboardShortcuts";
import { ClinicalEventSyncProvider } from "./ClinicalEventSyncProvider";
import { cn } from "@/lib/utils";

export function DoctorShell({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const isPrescriptions = isDoctorPrescriptionsRoute(pathname);
  const hideFab = shouldHideDoctorClinicalFab(pathname);

  return (
    <DoctorProvider>
      <LiveQueueProvider>
        <ProfileStoreProvider>
        <DoctorMobileChromeProvider>
          <div className="doctor-portal min-h-dvh w-full bg-[#F7F5F2] font-sans antialiased text-[#1B3B2E]">
            <div className="flex min-h-dvh w-full">
              <DoctorSideNav />
              <div className="flex min-w-0 flex-1 flex-col lg:ml-[260px] xl:ml-[280px]">
                <main
                  className={cn(
                    "doctor-mobile-main hide-scrollbar w-full flex-1 overflow-x-hidden",
                    isPrescriptions ? "p-0" : "px-4 py-5",
                    !isPrescriptions && "max-lg:pt-[var(--doctor-mobile-top)]",
                    !isPrescriptions && "max-lg:pb-[var(--doctor-mobile-bottom)]",
                    !isPrescriptions && "sm:px-6 sm:py-6",
                    !isPrescriptions && "lg:px-8 lg:py-8 lg:pb-10 lg:pt-8",
                    !isPrescriptions && "xl:px-12",
                    className,
                  )}
                  style={
                    !isPrescriptions
                      ? ({
                          "--doctor-mobile-top": DOCTOR_MOBILE_TOP_INSET,
                          "--doctor-mobile-bottom": hideFab
                            ? DOCTOR_MOBILE_BOTTOM_INSET
                            : DOCTOR_MOBILE_BOTTOM_INSET_WITH_FAB,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <Outlet />
                </main>
                <DoctorBottomNav />
                <DoctorClinicalToolsFab />
              </div>
            </div>
            <DoctorCommandPalette />
            <DoctorKeyboardShortcuts />
            <ClinicalEventSyncProvider />
          </div>
        </DoctorMobileChromeProvider>
        </ProfileStoreProvider>
      </LiveQueueProvider>
    </DoctorProvider>
  );
}

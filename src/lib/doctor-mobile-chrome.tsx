import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** Height of the mobile bottom tab bar (excluding safe-area inset). */
export const DOCTOR_TAB_BAR_HEIGHT = "4.5rem";

export const DOCTOR_TAB_BAR_OFFSET = `calc(${DOCTOR_TAB_BAR_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

/** Safe-area only — no floating header chrome on mobile */
export const DOCTOR_MOBILE_TOP_INSET = `max(0.75rem, env(safe-area-inset-top, 0px))`;

/** Clinical tools FAB (h-14) + gap above tab bar */
export const DOCTOR_FAB_STACK_HEIGHT = "4.25rem";

export const DOCTOR_MOBILE_BOTTOM_INSET = `calc(${DOCTOR_TAB_BAR_HEIGHT} + 0.75rem + env(safe-area-inset-bottom, 0px))`;

export const DOCTOR_MOBILE_BOTTOM_INSET_WITH_FAB = `calc(${DOCTOR_TAB_BAR_HEIGHT} + ${DOCTOR_FAB_STACK_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

/** Hide FAB on focused clinical / queue / inbox screens */
export function shouldHideDoctorClinicalFab(pathname: string): boolean {
  if (pathname.startsWith("/doctor/prescriptions")) return true;
  if (/^\/doctor\/patients\/[^/]+/.test(pathname)) return true;
  if (
    pathname.startsWith("/doctor/vitals") ||
    pathname.startsWith("/doctor/orders") ||
    pathname.startsWith("/doctor/encounters") ||
    pathname.startsWith("/doctor/queue") ||
    pathname.startsWith("/doctor/reports") ||
    pathname.startsWith("/doctor/settings") ||
    pathname.startsWith("/doctor/messaging")
  ) {
    return true;
  }
  return false;
}

type DoctorMobileChromeContextValue = {
  overlayCount: number;
  pushOverlay: () => void;
  popOverlay: () => void;
  hideTabBar: boolean;
};

const DoctorMobileChromeContext = createContext<DoctorMobileChromeContextValue | null>(null);

export function DoctorMobileChromeProvider({ children }: { children: React.ReactNode }) {
  const [overlayCount, setOverlayCount] = useState(0);

  const pushOverlay = useCallback(() => {
    setOverlayCount((count) => count + 1);
  }, []);

  const popOverlay = useCallback(() => {
    setOverlayCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      overlayCount,
      pushOverlay,
      popOverlay,
      hideTabBar: overlayCount > 0,
    }),
    [overlayCount, pushOverlay, popOverlay],
  );

  return (
    <DoctorMobileChromeContext.Provider value={value}>{children}</DoctorMobileChromeContext.Provider>
  );
}

export function useDoctorMobileChrome() {
  const ctx = useContext(DoctorMobileChromeContext);
  if (!ctx) {
    return {
      overlayCount: 0,
      hideTabBar: false,
      pushOverlay: () => {},
      popOverlay: () => {},
    };
  }
  return ctx;
}

/** Register a full-screen mobile overlay (sheet/modal) so the tab bar stays out of the way. */
export function useDoctorMobileOverlay(active: boolean) {
  const { pushOverlay, popOverlay } = useDoctorMobileChrome();

  useEffect(() => {
    if (!active) return;
    pushOverlay();
    return () => popOverlay();
  }, [active, pushOverlay, popOverlay]);
}

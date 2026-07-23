import { useEffect, useRef } from "react";
import { hydrateAllDeskRecords } from "@/lib/shared/persisted-store";

/** After staff login, pull remote desk blobs into localStorage once per session. */
export function DeskHydrator() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || typeof window === "undefined") return;
    ran.current = true;
    void hydrateAllDeskRecords().then(({ hydrated }) => {
      if (hydrated > 0) {
        window.dispatchEvent(new CustomEvent("medora-desk-hydrated", { detail: { hydrated } }));
      }
    });
  }, []);
  return null;
}

import { useEffect, useState } from "react";
import { BodyAnatomyMarker } from "@/components/clinical/BodyAnatomyMarker";
import type { SpecialtyDefinition } from "@/lib/specialties/types";
import {
  getSpecialtyAnatomy,
  specialtySeedMarkers,
} from "@/lib/specialties/anatomy-focus";
import {
  fetchAnatomyMarkers,
  syncAnatomyMarkers,
} from "@/lib/specialties/remote-sync";
import type { BodyMarker } from "@/lib/shared/body-anatomy";

type Props = {
  specialty: SpecialtyDefinition;
};

export function SpecialtyAnatomyPanel({ specialty }: Props) {
  const focus = getSpecialtyAnatomy(specialty.id);
  const [markers, setMarkers] = useState<BodyMarker[]>(() => specialtySeedMarkers(specialty.id));
  const [syncHint, setSyncHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMarkers(specialtySeedMarkers(specialty.id));
    void fetchAnatomyMarkers(specialty.id).then((remote) => {
      if (cancelled || !remote || remote.length === 0) return;
      setMarkers(remote);
      setSyncHint("Loaded from hospital database");
    });
    return () => {
      cancelled = true;
    };
  }, [specialty.id]);

  const onChange = (next: BodyMarker[]) => {
    setMarkers(next);
    setSyncHint("Saving…");
    void syncAnatomyMarkers(specialty.id, next).then((res) => {
      const ok = res && typeof res === "object" && "ok" in res && (res as { ok?: boolean }).ok;
      setSyncHint(ok ? "Saved to hospital database" : "Saved locally (DB offline)");
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-[24px] border border-[#E8E4DE] bg-white p-4 sm:p-5"
        style={{ borderTopWidth: 3, borderTopColor: specialty.accent }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8F8C]">
          Specialty 3D anatomy
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1B3B2E]">{focus.title}</h3>
        <p className="text-sm text-[#5C6B63]">{focus.subtitle}</p>
        {syncHint ? <p className="mt-2 text-[11px] text-[#8A8F8C]">{syncHint}</p> : null}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {focus.structures.map((s) => (
            <li
              key={s.name}
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: specialty.accentSoft }}
            >
              <span className="font-semibold" style={{ color: specialty.accent }}>
                {s.name}
              </span>
              <span className="text-[#5C6B63]"> — {s.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <BodyAnatomyMarker
        key={specialty.id}
        markers={markers}
        onChange={onChange}
        title={focus.title}
        subtitle={`${specialty.name} focus · ${focus.subtitle}`}
        initialView={focus.defaultView}
        initialPreset={focus.defaultPreset}
        cameraTarget={focus.cameraTarget}
        cameraDistance={focus.cameraDistance}
        focusKeywords={focus.focusKeywords}
      />
    </div>
  );
}

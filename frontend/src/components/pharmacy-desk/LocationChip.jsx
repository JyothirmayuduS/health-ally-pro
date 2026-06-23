import React from "react";
import { classNames } from "@/lib/pharmacy-desk/utils";
import { MapPin } from "lucide-react";

const ZONE_TONES = {
  MAIN:       "bg-emerald-50 border-emerald-200 text-emerald-800",
  COLD_CHAIN: "bg-sky-50 border-sky-200 text-sky-800",
  CONTROLLED: "bg-rose-50 border-rose-200 text-rose-800",
  OTC:        "bg-amber-50 border-amber-200 text-amber-800",
};

export default function LocationChip({ location, compact = false, dataTestId }) {
  if (!location) return <span className="text-[11px] text-muted-foreground italic">no location</span>;
  const tone = ZONE_TONES[location.zone] || "bg-stone-50 border-stone-200 text-stone-700";
  return (
    <span
      data-testid={dataTestId || "location-chip"}
      className={classNames("pharm-pill font-mono", tone)}
      title={`${location.zone} · Aisle ${location.aisle}`}
    >
      <MapPin className="h-3 w-3" />
      {compact ? location.code : `${location.aisle} · ${location.code}`}
    </span>
  );
}

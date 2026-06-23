import React from "react";
import { classNames } from "@/lib/pharmacy-desk/utils";

export default function KpiCard({ label, value, hint, tone = "default", icon: Icon, onClick, dataTestId }) {
  const tones = {
    default: "bg-card",
    sage:    "bg-[hsl(var(--sage-50))]",
    warm:    "bg-[hsl(var(--paper-100))]",
    alert:   "bg-rose-50/70",
  };

  return (
    <button
      data-testid={dataTestId}
      onClick={onClick}
      className={classNames(
        "pharm-card text-left p-5 group transition-all hover:-translate-y-0.5 hover:shadow-md",
        tones[tone] || tones.default,
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {label}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--sage-500))] transition-colors" strokeWidth={1.6} />}
      </div>
      <div className="mt-3 font-display text-[40px] leading-none tabular-nums text-[hsl(var(--ink))]">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
      )}
    </button>
  );
}

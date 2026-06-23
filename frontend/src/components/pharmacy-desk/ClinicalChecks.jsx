import React from "react";
import { runClinicalChecks, SEVERITY_META } from "@/lib/pharmacy-desk/interactions";
import { usePharmacy, TONE_CLASSES } from "@/lib/pharmacy-desk/store";
import { ShieldAlert, AlertTriangle, Info, FlaskConical, Baby, Pill } from "lucide-react";
import { classNames } from "@/lib/pharmacy-desk/utils";

const TYPE_ICON = {
  allergy:     ShieldAlert,
  interaction: FlaskConical,
  duplicate:   Pill,
  pregnancy:   Baby,
  dose:        AlertTriangle,
  "high-alert":AlertTriangle,
  controlled:  Info,
};

export default function ClinicalChecks({ prescription, dataTestId }) {
  const ph = usePharmacy();
  if (!prescription) return null;
  const patient = ph.getPatient(prescription.patientId);
  const findings = runClinicalChecks({ prescription, patient, inventory: ph.inventory });

  // Group by severity ordered major > moderate > minor > info
  const order = ["major", "moderate", "minor", "info"];
  const grouped = order.map((sev) => ({ sev, items: findings.filter((f) => f.severity === sev) }));
  const total = findings.length;

  return (
    <section data-testid={dataTestId || "clinical-checks"}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[15px] text-muted-foreground uppercase tracking-[0.12em]">
          Clinical checks
        </h3>
        <span className="text-[11px] text-muted-foreground">{total} finding{total === 1 ? "" : "s"}</span>
      </div>

      {total === 0 ? (
        <div className="pharm-card p-3 bg-emerald-50/40 border-emerald-200 text-[13px] text-emerald-800">
          ✓ No allergy, interaction, duplicate-therapy, pregnancy, or dose flags detected.
        </div>
      ) : (
        <ul className="space-y-2">
          {grouped.map(({ sev, items }) =>
            items.map((f, idx) => {
              const meta = SEVERITY_META[f.severity];
              const Icon = TYPE_ICON[f.type] || AlertTriangle;
              return (
                <li
                  key={`${sev}-${idx}`}
                  data-testid={`clinical-${f.severity}-${f.type}`}
                  className={classNames("pharm-card p-3 flex items-start gap-3", TONE_CLASSES[meta.tone])}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold">{meta.label}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">{f.type}</span>
                    </div>
                    <div className="mt-0.5 text-[13px]">{f.message}</div>
                  </div>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </section>
  );
}

export function hasBlockingFinding(prescription, patient, inventory) {
  return runClinicalChecks({ prescription, patient, inventory }).some((f) => f.severity === "major");
}

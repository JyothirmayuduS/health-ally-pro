import { CRITICAL_THRESHOLDS } from "./criticalValues";
import type { CatalogParameter } from "./mockData";

export interface CriticalAlert {
  parameterName: string;
  value: string;
  unit: string;
  threshold: string;
  direction: "low" | "high";
  severity: "critical";
}

export function checkCriticalValues(
  results: Record<string, string> | undefined | null,
  parameters: CatalogParameter[] | undefined | null
): CriticalAlert[] {
  if (!results || !parameters) return [];
  const alerts: CriticalAlert[] = [];

  for (const p of parameters) {
    const valStr = results[p.key];
    if (valStr === undefined || valStr === "" || valStr === null) continue;
    const num = Number(valStr);
    if (isNaN(num)) continue;

    // 1. Check catalog thresholds if defined
    if (p.critical_low !== undefined && num <= p.critical_low) {
      alerts.push({
        parameterName: p.label,
        value: valStr,
        unit: p.unit,
        threshold: `<= ${p.critical_low}`,
        direction: "low",
        severity: "critical",
      });
      continue;
    }
    if (p.critical_high !== undefined && num >= p.critical_high) {
      alerts.push({
        parameterName: p.label,
        value: valStr,
        unit: p.unit,
        threshold: `>= ${p.critical_high}`,
        direction: "high",
        severity: "critical",
      });
      continue;
    }

    // 2. Fallback to standard criticalValues map (matching key case-insensitively)
    const normalizedKey = p.key.toLowerCase();
    const thresh = CRITICAL_THRESHOLDS[normalizedKey];
    if (thresh) {
      if (thresh.low !== undefined && num <= thresh.low) {
        alerts.push({
          parameterName: thresh.name,
          value: valStr,
          unit: thresh.unit,
          threshold: `<= ${thresh.low}`,
          direction: "low",
          severity: "critical",
        });
      } else if (thresh.high !== undefined && num >= thresh.high) {
        alerts.push({
          parameterName: thresh.name,
          value: valStr,
          unit: thresh.unit,
          threshold: `>= ${thresh.high}`,
          direction: "high",
          severity: "critical",
        });
      }
    }
  }

  return alerts;
}

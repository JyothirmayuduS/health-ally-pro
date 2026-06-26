import type { LabCatalogItem, LabOrder } from "./mockData";
import { findCatalog } from "./mockData";
import { flagValue } from "./utils";

export type LabAnalytics = {
  totals: { orders: number; validated: number; pending: number };
  avg_tat_hours: number | null;
  by_test: Record<string, number>;
  by_section: Record<string, number>;
  by_status: Record<string, number>;
  by_day: Record<string, number>;
  criticals: { order_id: string; param: string; value: string; at: string }[];
};

export function computeAnalytics(orders: LabOrder[]): LabAnalytics {
  const by_test: Record<string, number> = {};
  const by_section: Record<string, number> = {};
  const by_status: Record<string, number> = {};
  const by_day: Record<string, number> = {};
  const criticals: LabAnalytics["criticals"] = [];
  let tatSum = 0;
  let tatCount = 0;

  for (const o of orders) {
    by_test[o.test_code] = (by_test[o.test_code] || 0) + 1;
    const cat = findCatalog(o.test_code);
    if (cat) by_section[cat.section] = (by_section[cat.section] || 0) + 1;
    by_status[o.status] = (by_status[o.status] || 0) + 1;
    const day = o.ordered_at.slice(0, 10);
    by_day[day] = (by_day[day] || 0) + 1;

    if (o.released_at && o.ordered_at) {
      tatSum +=
        (new Date(o.released_at).getTime() - new Date(o.ordered_at).getTime()) / 3_600_000;
      tatCount += 1;
    }

    if (o.results && cat) {
      for (const p of cat.parameters) {
        const f = flagValue(p, o.results[p.key]);
        if (f.level === "critical") {
          criticals.push({
            order_id: o.id,
            param: p.key,
            value: o.results[p.key],
            at: o.completed_at || o.ordered_at,
          });
        }
      }
    }
  }

  const pending = orders.filter(
    (o) => !["validated", "cancelled"].includes(o.status),
  ).length;

  return {
    totals: {
      orders: orders.length,
      validated: orders.filter((o) => o.status === "validated").length,
      pending,
    },
    avg_tat_hours: tatCount ? Math.round((tatSum / tatCount) * 10) / 10 : null,
    by_test,
    by_section,
    by_status,
    by_day,
    criticals,
  };
}

export function printSpecimenLabel(
  order: LabOrder,
  patientName: string,
  patientMrn: string,
  catalog?: LabCatalogItem,
) {
  const html = `<html><head><title>Label ${order.accession}</title>
    <style>body{font-family:'IBM Plex Mono',monospace;padding:1rem;}
    .label{border:2px solid #2c5e4e;padding:1rem;width:340px;}
    .row{display:flex;justify-content:space-between;font-size:11px;margin:4px 0;}
    h3{margin:0 0 8px;font-size:14px;letter-spacing:0.05em;color:#2c5e4e;}
    .barcode{font-size:24px;letter-spacing:0.2em;text-align:center;margin:8px 0;}
    </style></head><body><div class="label">
    <h3>MAPLE HOSPITAL · SPECIMEN</h3>
    <div class="barcode">|||  ${order.accession}  |||</div>
    <div class="row"><span>Patient</span><b>${patientName}</b></div>
    <div class="row"><span>MRN</span><b>${patientMrn}</b></div>
    <div class="row"><span>Test</span><b>${order.test_code}</b></div>
    <div class="row"><span>Sample</span><b>${catalog?.sample_type || "—"}</b></div>
    <div class="row"><span>Tube</span><b>${catalog?.tube || "—"}</b></div>
    <div class="row"><span>Priority</span><b>${order.priority.toUpperCase()}</b></div>
    </div><script>window.print();</script></body></html>`;
  const w = window.open("", "_blank", "width=420,height=560");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

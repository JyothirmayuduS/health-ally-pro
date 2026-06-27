// Real print utilities — opens a new window with formatted HTML and triggers print.

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const HOSPITAL = {
  name: "Maple Hospital",
  address: "44 Linking Road, Bandra West, Mumbai 400050",
  phone: "+91 22 4455 1100",
  gst: "27ABCDE1234F1Z9",
};

function openPrintWindow(title, bodyHtml, widthMm = 80) {
  const w = window.open("", "_blank", "width=480,height=720");
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#fff;color:#1c1c19;font-family:'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;}
  body{padding:16px 14px;width:${widthMm}mm;max-width:100%;font-size:12px;line-height:1.45;}
  .center{text-align:center;}
  .right{text-align:right;}
  .mono{font-family:'IBM Plex Mono','Courier New',monospace;}
  .sm{font-size:10.5px;color:#575753;}
  .xs{font-size:9.5px;color:#8a8a86;letter-spacing:0.08em;text-transform:uppercase;}
  .h{font-weight:600;font-size:14px;letter-spacing:-0.01em;}
  .xl{font-size:20px;font-weight:700;}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin:3px 0;}
  hr{border:none;border-top:1px dashed #c9c9c4;margin:10px 0;}
  table{width:100%;border-collapse:collapse;font-size:11.5px;}
  th{text-align:left;font-weight:600;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#575753;padding:4px 0;border-bottom:1px solid #e5e5e0;}
  td{padding:5px 0;border-bottom:1px dotted #e5e5e0;vertical-align:top;}
  .total{font-size:14px;font-weight:700;}
  .badge{display:inline-block;padding:2px 8px;border:1px solid #15803d;color:#15803d;border-radius:99px;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}
  .stamp{margin-top:14px;padding:10px;border:1px dashed #c9c9c4;border-radius:6px;font-size:10.5px;}
  .qr{margin:8px auto;display:block;}
  @media print{ @page{margin:0;} body{padding:8px 10px;} }
</style>
</head><body>
${bodyHtml}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };</script>
</body></html>`);
  w.document.close();
  w.focus();
}

export function printReceipt({ invoice, patient, doctor, totals }) {
  const items = invoice.items
    .map(
      (it) => `<tr>
        <td>${it.label}</td>
        <td class="right mono">${it.qty}</td>
        <td class="right mono">${fmt(it.unit)}</td>
        <td class="right mono">${fmt(it.amount)}</td>
      </tr>`,
    )
    .join("");
  const paidBadge =
    invoice.status === "paid"
      ? `<span class="badge">Paid · ${invoice.method?.toUpperCase() || "—"}</span>`
      : `<span class="badge" style="border-color:#b85c38;color:#b85c38">Due</span>`;
  const body = `
    <div class="center">
      <div class="h">${HOSPITAL.name}</div>
      <div class="sm">${HOSPITAL.address}</div>
      <div class="sm">Tel ${HOSPITAL.phone} · GSTIN ${HOSPITAL.gst}</div>
    </div>
    <hr/>
    <div class="row"><div class="xs">Receipt</div><div class="mono">${invoice.id}</div></div>
    <div class="row"><div class="xs">Date</div><div class="mono">${invoice.date} · ${invoice.paidAt ? invoice.paidAt.slice(11, 16) : new Date().toTimeString().slice(0, 5)}</div></div>
    <div class="row"><div class="xs">Patient</div><div>${patient?.name || ""}<div class="sm mono">${patient?.id || ""}</div></div></div>
    <div class="row"><div class="xs">Doctor</div><div>${doctor?.name || ""}<div class="sm">${doctor?.specialty || ""}</div></div></div>
    <div class="row"><div class="xs">Status</div><div>${paidBadge}</div></div>
    <hr/>
    <table>
      <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <hr/>
    <div class="row"><div>Subtotal</div><div class="mono">${fmt(totals.subtotal)}</div></div>
    ${totals.discount ? `<div class="row"><div>Discount</div><div class="mono">- ${fmt(totals.discount)}</div></div>` : ""}
    <div class="row"><div>Tax (5%)</div><div class="mono">${fmt(totals.tax)}</div></div>
    <div class="row total" style="margin-top:6px"><div>Total</div><div class="mono">${fmt(totals.total)}</div></div>
    ${invoice.status === "paid" ? `<div class="stamp center">Received with thanks via <b>${invoice.method?.toUpperCase()}</b> · ${invoice.paidAt?.replace("T", " · ") || ""}</div>` : ""}
    <div class="center sm" style="margin-top:14px">Get well soon. Thank you for choosing ${HOSPITAL.name}.</div>
    <div class="center xs" style="margin-top:4px">This is a computer-generated receipt.</div>
  `;
  openPrintWindow(`Receipt · ${invoice.id}`, body, 80);
}

export function printToken({ token, patient, doctor, appointment }) {
  const body = `
    <div class="center">
      <div class="h">${HOSPITAL.name}</div>
      <div class="sm">OPD Reception · Token slip</div>
    </div>
    <hr/>
    <div class="center" style="padding:8px 0">
      <div class="xs">Now serving</div>
      <div class="xl mono" style="font-size:64px;line-height:1;color:#2C5E4E;margin:6px 0">#${token}</div>
      <div class="sm">${appointment?.time || ""} · ${appointment?.type || ""}</div>
    </div>
    <hr/>
    <div class="row"><div class="xs">Patient</div><div>${patient?.name || ""}<div class="sm mono">${patient?.id || ""}</div></div></div>
    <div class="row"><div class="xs">Doctor</div><div>${doctor?.name || ""}<div class="sm">${doctor?.specialty || ""} · Room ${doctor?.room || ""}</div></div></div>
    <hr/>
    <div class="center sm">Please wait in the lobby — your token will be called.</div>
    <div class="center xs" style="margin-top:6px">${new Date().toLocaleString()}</div>
  `;
  openPrintWindow(`Token #${token}`, body, 70);
}

export function printDaySheet({ date, kpis, byMethod, byDoctor, shifts, noShows }) {
  const methodRows = byMethod
    .map(
      (m) =>
        `<tr><td>${m.method}</td><td class="right mono">${fmt(m.value)}</td></tr>`,
    )
    .join("");
  const docRows = byDoctor
    .map(
      (d) =>
        `<tr><td>${d.name}</td><td class="right mono">${d.booked}</td><td class="right mono">${fmt(d.revenue)}</td></tr>`,
    )
    .join("");
  const shiftRows = shifts
    .map(
      (s) =>
        `<tr><td>${s.label}</td><td>${s.staff}</td><td class="mono">${s.opened}</td><td class="mono">${s.closed || "—"}</td><td class="right mono">${fmt(s.cash)}</td><td class="right mono" style="color:${s.variance === 0 ? "#15803d" : s.variance > 0 ? "#a87826" : "#b85c38"}">${s.variance >= 0 ? "+" : ""}${fmt(s.variance || 0)}</td></tr>`,
    )
    .join("");
  const nsRows = noShows.length
    ? noShows
        .map(
          (n) =>
            `<tr><td>${n.time}</td><td>${n.patient}</td><td>${n.doctor}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="center sm">No-shows: none recorded</td></tr>`;
  const body = `
    <div class="center" style="border-bottom:2px solid #1c1c19;padding-bottom:8px;margin-bottom:10px">
      <div class="h" style="font-size:18px">${HOSPITAL.name}</div>
      <div class="sm">Reception desk · End-of-day sheet · ${date}</div>
    </div>

    <div class="xs" style="margin-top:6px">Headline numbers</div>
    <table style="margin:6px 0">
      <tr><td>Footfall</td><td class="right mono">${kpis.footfall}</td><td>No-shows</td><td class="right mono">${kpis.noShow} (${kpis.noShowRate}%)</td></tr>
      <tr><td>Avg wait</td><td class="right mono">${kpis.avgWait} min</td><td>Desk revenue</td><td class="right mono">${fmt(kpis.revenue)}</td></tr>
    </table>

    <div class="xs" style="margin-top:10px">Collected by method</div>
    <table style="margin-top:4px">
      <thead><tr><th>Method</th><th class="right">Amount</th></tr></thead>
      <tbody>${methodRows}</tbody>
    </table>

    <div class="xs" style="margin-top:10px">Revenue by doctor</div>
    <table style="margin-top:4px">
      <thead><tr><th>Doctor</th><th class="right">Appts</th><th class="right">Revenue</th></tr></thead>
      <tbody>${docRows}</tbody>
    </table>

    <div class="xs" style="margin-top:10px">Shifts &amp; cash drawer</div>
    <table style="margin-top:4px">
      <thead><tr><th>Shift</th><th>Staff</th><th>Open</th><th>Close</th><th class="right">Cash</th><th class="right">Var</th></tr></thead>
      <tbody>${shiftRows}</tbody>
    </table>

    <div class="xs" style="margin-top:10px">No-shows</div>
    <table style="margin-top:4px">
      <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th></tr></thead>
      <tbody>${nsRows}</tbody>
    </table>

    <div class="stamp" style="margin-top:14px">
      <div class="xs">Signed off by</div>
      <div style="margin-top:18px;border-top:1px solid #1c1c19;padding-top:4px" class="sm center">Front desk lead · ${new Date().toLocaleDateString()}</div>
    </div>
  `;
  openPrintWindow(`Day sheet · ${date}`, body, 190); // A4-ish portrait
}

export function printDayReport({ shift, collections, refunds, variance, topServices, cancellations }) {
  const methodRows = Object.entries(collections)
    .map(([method, amount]) => `<tr><td>${method.toUpperCase()}</td><td class="right mono">${fmt(amount)}</td></tr>`)
    .join("");

  const serviceRows = topServices
    .map((s: any, idx) => `<tr><td class="mono">#${idx + 1}</td><td>${s.name}</td><td class="right mono">${s.count}</td><td class="right mono">${fmt(s.revenue)}</td></tr>`)
    .join("");

  const cancelRows = Object.entries(cancellations)
    .map(([reason, count]) => `<tr><td>${reason}</td><td class="right mono">${count}</td></tr>`)
    .join("");

  const body = `
    <div class="center" style="border-bottom:2px solid #1c1c19;padding-bottom:8px;margin-bottom:10px">
      <div class="h" style="font-size:16px">${HOSPITAL.name}</div>
      <div class="sm">Shift End Report · ${shift.label}</div>
    </div>
    
    <div class="xs">Shift Details</div>
    <table style="margin:6px 0">
      <tr><td>Staff</td><td class="right">${shift.staff}</td></tr>
      <tr><td>Opened</td><td class="right mono">${shift.opened}</td></tr>
      <tr><td>Closed</td><td class="right mono">${shift.closed || "—"}</td></tr>
      <tr><td>Opening Cash</td><td class="right mono">${fmt(shift.openingCash || 0)}</td></tr>
    </table>
    
    <hr/>
    <div class="xs">Collections by Method</div>
    <table style="margin:6px 0">
      <thead><tr><th>Method</th><th class="right">Amount</th></tr></thead>
      <tbody>
        ${methodRows}
      </tbody>
    </table>
    
    <hr/>
    <div class="xs">Adjustments & Drawer</div>
    <table style="margin:6px 0">
      <tr><td>Expected Cash</td><td class="right mono">${fmt(shift.expectedCash || 0)}</td></tr>
      <tr><td>Actual Cash</td><td class="right mono">${fmt(shift.actualCash || 0)}</td></tr>
      <tr><td>Total Refunds</td><td class="right mono" style="color:#b85c38">${fmt(refunds || 0)}</td></tr>
      <tr><td>Variance</td><td class="right mono" style="color:${variance === 0 ? "#15803d" : variance > 0 ? "#a87826" : "#b85c38"}">${variance >= 0 ? "+" : ""}${fmt(variance)}</td></tr>
    </table>
    
    <hr/>
    <div class="xs">Top Services / Treatments</div>
    <table style="margin:6px 0">
      <thead><tr><th>Rank</th><th>Service</th><th class="right">Count</th><th class="right">Revenue</th></tr></thead>
      <tbody>
        ${serviceRows}
      </tbody>
    </table>
    
    <hr/>
    <div class="xs">Cancellations Reason Breakdown</div>
    <table style="margin:6px 0">
      <thead><tr><th>Reason</th><th class="right">Count</th></tr></thead>
      <tbody>
        ${cancelRows.length ? cancelRows : '<tr><td colspan="2" class="center sm">No cancellations recorded</td></tr>'}
      </tbody>
    </table>
    
    <div class="stamp" style="margin-top:14px">
      <div class="xs">Verified by staff</div>
      <div style="margin-top:18px;border-top:1px solid #1c1c19;padding-top:4px" class="sm center">${shift.staff} · ${new Date().toLocaleDateString()}</div>
    </div>
  `;
  openPrintWindow(`Shift Report · ${shift.id}`, body, 110);
}

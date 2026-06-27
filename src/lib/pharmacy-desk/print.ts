const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const HOSPITAL = {
  name: "Maple Hospital",
  address: "44 Linking Road, Bandra West, Mumbai 400050",
  phone: "+91 22 4455 1100",
  gst: "27ABCDE1234F1Z9",
};

function openPrintWindow(title: string, bodyHtml: string, widthMm = 110) {
  const w = window.open("", "_blank", "width=600,height=800");
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#fff;color:#1c1c19;font-family:'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;}
  body{padding:20px;width:${widthMm}mm;max-width:100%;font-size:12px;line-height:1.4;}
  .center{text-align:center;}
  .right{text-align:right;}
  .mono{font-family:'IBM Plex Mono','Courier New',monospace;}
  .sm{font-size:10.5px;color:#575753;}
  .xs{font-size:9.5px;color:#8a8a86;letter-spacing:0.08em;text-transform:uppercase;}
  .h{font-weight:600;font-size:15px;letter-spacing:-0.01em;}
  .xl{font-size:22px;font-weight:700;}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin:4px 0;}
  hr{border:none;border-top:1px dashed #c9c9c4;margin:12px 0;}
  table{width:100%;border-collapse:collapse;font-size:11.5px;margin:8px 0;}
  th{text-align:left;font-weight:600;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#575753;padding:5px 0;border-bottom:1px solid #e5e5e0;}
  td{padding:6px 0;border-bottom:1px dotted #e5e5e0;vertical-align:top;}
  .total{font-size:13px;font-weight:700;color:#1c1c19;}
  .stamp{margin-top:20px;padding:12px;border:1px dashed #c9c9c4;border-radius:6px;font-size:10.5px;}
  @media print{ @page{margin:0;} body{padding:10px;} }
</style>
</head><body>
${bodyHtml}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`);
  w.document.close();
  w.focus();
}

export function printPharmacistShiftReport(report: any) {
  const reconRows = report.reconciliation
    .map(
      (r: any) => `
      <tr>
        <td>${r.drugName}</td>
        <td class="right mono">${r.openingBalance}</td>
        <td class="right mono">${r.totalDispensed}</td>
        <td class="right mono">${r.closingBalance}</td>
        <td class="right mono" style="color: ${r.variance !== 0 ? "#b85c38" : "inherit"}">${r.variance}</td>
      </tr>
    `
    )
    .join("");

  const body = `
    <div class="center">
      <div class="h" style="font-size: 16px;">${HOSPITAL.name}</div>
      <div class="sm">${HOSPITAL.address}</div>
      <div class="sm">Pharmacy Handover &amp; Shift Report</div>
    </div>
    <hr/>
    <div class="row"><div class="xs">Report Reference</div><div class="mono font-medium">${report.id}</div></div>
    <div class="row"><div class="xs">Signed Off At</div><div class="mono">${new Date(report.signedAt).toLocaleString()}</div></div>
    <div class="row"><div class="xs">Pharmacist</div><div><b>${report.pharmacistName}</b></div></div>
    <div class="row"><div class="xs">Supervisor Co-Sign</div><div><b>${report.supervisorName}</b></div></div>
    
    <hr/>
    <div class="xs">Section A: Dispensing Summary</div>
    <table style="margin-top: 4px;">
      <tr><td>Total Prescriptions Processed</td><td class="right mono font-semibold">${report.rxCount}</td></tr>
      <tr><td>Breakdown</td><td class="right sm">STAT: ${report.priorityBreakdown.stat} · Urgent: ${report.priorityBreakdown.urgent} · Routine: ${report.priorityBreakdown.routine}</td></tr>
      <tr><td>Dispensed Line Items</td><td class="right mono">${report.lineItemsCount}</td></tr>
      <tr><td>Avg Processing Speed</td><td class="right mono">${report.avgDispenseTime}</td></tr>
    </table>

    <hr/>
    <div class="xs">Section B: Controlled Substance Reconciliation</div>
    <table style="margin-top: 4px;">
      <thead>
        <tr>
          <th>Drug</th>
          <th class="right">Open</th>
          <th class="right">Disp</th>
          <th class="right">Close</th>
          <th class="right">Var</th>
        </tr>
      </thead>
      <tbody>
        ${reconRows.length ? reconRows : `<tr><td colspan="5" class="center sm">No controlled items dispensed this shift</td></tr>`}
      </tbody>
    </table>

    <hr/>
    <div class="xs">Section C: OTC & Retail Sales</div>
    <table style="margin-top: 4px;">
      <tr><td>Cash Sales</td><td class="right mono">${fmt(report.otcBreakdown.cash)}</td></tr>
      <tr><td>Card Sales</td><td class="right mono">${fmt(report.otcBreakdown.card)}</td></tr>
      <tr><td>UPI / Digital Sales</td><td class="right mono">${fmt(report.otcBreakdown.upi)}</td></tr>
      <tr class="total"><td>Total OTC Revenue</td><td class="right mono">${fmt(report.otcTotal)}</td></tr>
    </table>

    <hr/>
    <div class="xs">Section D: Clinical Alerts & Compliance</div>
    <table style="margin-top: 4px;">
      <tr><td>DDI Overrides Logged</td><td class="right mono">${report.ddiOverridesCount}</td></tr>
      <tr><td>Near-Expiry Actions</td><td class="right mono">${report.nearExpiryActioned} items</td></tr>
      <tr><td>Cold Chain Breaches</td><td class="right mono" style="color: ${report.coldChainBreaches > 0 ? "#b85c38" : "inherit"}">${report.coldChainBreaches}</td></tr>
    </table>

    <hr/>
    <div class="xs">Section E: Wastage & returns</div>
    <table style="margin-top: 4px;">
      <tr><td>Ward Returns Processed</td><td class="right mono">${report.wardReturnsCount} returns</td></tr>
      <tr><td>Wastage Disposed Value</td><td class="right mono" style="color: #b85c38">${fmt(report.wastageValue)}</td></tr>
    </table>

    ${report.notes ? `
      <hr/>
      <div class="xs">Handover Remarks</div>
      <div style="font-size: 11px; padding: 6px; background: #fcfcfb; border: 1px solid #e5e5e0; border-radius: 4px; margin-top: 4px; line-height: 1.4;">
        ${report.notes}
      </div>
    ` : ""}

    <div class="stamp">
      <div class="xs">Authorized Signatures</div>
      <div class="row" style="margin-top: 24px;">
        <div style="border-top: 1px solid #c9c9c4; width: 45%; padding-top: 4px;" class="center sm">Pharmacist Sign<br/><b>${report.pharmacistName}</b></div>
        <div style="border-top: 1px solid #c9c9c4; width: 45%; padding-top: 4px;" class="center sm">Supervisor Sign<br/><b>${report.supervisorName}</b></div>
      </div>
    </div>
    
    <div class="center sm" style="margin-top: 20px; color: #8a8a86;">Oak Haven Pharmacy Desk compliance record.</div>
  `;

  openPrintWindow(`Shift-Report-${report.id}`, body, 110);
}

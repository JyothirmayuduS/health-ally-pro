const RX_PRINT_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #1b1b1b; }
  body { padding: 0; }
  #medora-rx-print {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    background: #fff;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }
  @page { size: A4; margin: 8mm; }
  @media print {
    body { padding: 0; }
    #medora-rx-print { max-width: none; }
  }
`;

function collectDocumentStyles(): string {
  if (typeof document === "undefined") return "";
  return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join("\n");
}

function buildPrintHtml(title: string, bodyHtml: string): string {
  const appStyles = collectDocumentStyles();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${appStyles}
  <style>${RX_PRINT_STYLES}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

function printViaHiddenIframe(html: string): boolean {
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = iframe.contentDocument ?? win?.document;
    if (!win || !doc) {
      iframe.remove();
      return false;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 500);
    };

    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(cleanup, 3000);
    }, 350);

    return true;
  } catch {
    return false;
  }
}

function printViaPopup(html: string): boolean {
  const w = window.open("", "_blank", "noopener,noreferrer,width=920,height=1100");
  if (!w) return false;

  w.document.open();
  w.document.write(`${html}
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 300);
    };
    window.onafterprint = function () {
      setTimeout(function () { window.close(); }, 100);
    };
  </script>`);
  w.document.close();
  w.focus();
  return true;
}

/** Fallback when iframe/popup fail — uses body class + window.print on main page. */
function printViaMainDocument(): boolean {
  document.body.classList.add("medora-rx-printing");
  const cleanup = () => document.body.classList.remove("medora-rx-printing");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1500);
  return true;
}

/**
 * Print the #medora-rx-print element. Tries hidden iframe first (no pop-up blocker),
 * then a new window, then main-document fallback.
 */
export function printPrescriptionDocument(rxNumber?: string): boolean {
  const el = document.getElementById("medora-rx-print");
  if (!el) {
    console.warn("[print] #medora-rx-print not found");
    return false;
  }

  const title = rxNumber ? `Prescription ${rxNumber}` : "Prescription";
  const html = buildPrintHtml(title, el.outerHTML);

  if (printViaHiddenIframe(html)) return true;
  if (printViaPopup(html)) return true;
  return printViaMainDocument();
}

export interface ThermalLine {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  size?: "normal" | "large";
  divider?: boolean;
}

const ESC = "\x1B";
const GS = "\x1D";

export interface ThermalOptions {
  width?: number;
  cut?: boolean;
}

export function buildThermalReceipt(lines: ThermalLine[], opts: ThermalOptions = {}): string {
  const width = opts.width ?? 32;
  let data = "";

  data += ESC + "@";
  for (const line of lines) {
    const text = line.divider ? "-".repeat(width) : line.text;
    if (line.size === "large") {
      data += GS + "!" + "\x30";
    } else {
      data += GS + "!" + "\x00";
    }
    data += line.bold ? ESC + "E" + "\x01" : ESC + "E" + "\x00";
    if (line.align === "center") {
      data += ESC + "a" + "\x01";
    } else if (line.align === "right") {
      data += ESC + "a" + "\x02";
    } else {
      data += ESC + "a" + "\x00";
    }
    data += text + "\n";
  }

  data += GS + "!" + "\x00";
  data += ESC + "E" + "\x00";
  data += ESC + "a" + "\x00";
  data += "\n\n\n";
  if (opts.cut) data += GS + "V" + "\x00";
  return data;
}

export interface ReceiptItem {
  name: string;
  variant?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptData {
  storeName: string;
  storeTagline?: string;
  storePhone?: string;
  invoiceNumber: string;
  date: string;
  status: string;
  customerName: string;
  customerPhone: string;
  channel?: string;
  delivery?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  taxLabel?: string;
  total: number;
  footer?: string;
}

function esc(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );
}

function money(value: number): string {
  return (
    "$" +
    value.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

export function receiptToLines(data: ReceiptData, width = 32): ThermalLine[] {
  const lines: ThermalLine[] = [
    { text: data.storeName, align: "center", bold: true, size: "large" },
  ];
  if (data.storeTagline) lines.push({ text: data.storeTagline, align: "center" });
  if (data.storePhone) lines.push({ text: `Tel: ${data.storePhone}`, align: "center" });
  lines.push({ text: "", align: "center", divider: true });
  lines.push({ text: `Factura: ${data.invoiceNumber}`, align: "left" });
  lines.push({ text: `Fecha: ${data.date}`, align: "left" });
  lines.push({ text: `Estado: ${data.status}`, align: "left" });
  lines.push({ text: "", divider: true });
  lines.push({ text: `Cliente: ${data.customerName}`, align: "left" });
  lines.push({ text: `Telefono: ${data.customerPhone}`, align: "left" });
  if (data.channel) lines.push({ text: `Canal: ${data.channel}`, align: "left" });
  if (data.delivery) lines.push({ text: `Entrega: ${data.delivery}`, align: "left" });
  lines.push({ text: "", divider: true });

  for (const item of data.items) {
    const name = item.variant ? `${item.name} - ${item.variant}` : item.name;
    lines.push({ text: name, align: "left" });
    const left = `  ${item.quantity} x ${money(item.unitPrice)}`;
    lines.push({ text: `${left.padEnd(width - money(item.lineTotal).length)}${money(item.lineTotal)}`, align: "left" });
  }

  lines.push({ text: "", divider: true });
  const totalRow = (label: string, value: number) => {
    const left = label + ":";
    const right = money(value);
    return `${left}${" ".repeat(Math.max(1, width - left.length - right.length))}${right}`;
  };
  lines.push({ text: totalRow("Subtotal", data.subtotal), align: "left" });
  lines.push({ text: totalRow(data.taxLabel ?? "IVA", data.tax), align: "left" });
  lines.push({ text: totalRow("TOTAL", data.total), align: "left", bold: true });
  lines.push({ text: "", divider: true });
  lines.push({ text: data.footer ?? "GRACIAS POR SU COMPRA", align: "center" });
  return lines;
}

export interface ReceiptHtmlOptions {
  paper?: 58 | 80;
  autoPrint?: boolean;
}

export function buildReceiptHtml(data: ReceiptData, opts: ReceiptHtmlOptions = {}): string {
  const paper = opts.paper ?? 58;
  const autoPrint = opts.autoPrint ?? true;

  const itemsHtml = data.items.length
    ? data.items
        .map((item) => {
          const name = item.variant ? `${item.name} · ${item.variant}` : item.name;
          return `
        <div class="item">
          <div class="item-name">${esc(name)}</div>
          <div class="item-calc">
            <span>${item.quantity} × ${money(item.unitPrice)}</span>
            <span>${money(item.lineTotal)}</span>
          </div>
        </div>`;
        })
        .join("")
    : `<div class="item muted center">Sin ítems</div>`;

  const metaRows: [string, string][] = [
    ["Factura", data.invoiceNumber],
    ["Fecha", data.date],
    ["Estado", data.status],
  ];
  if (data.channel) metaRows.push(["Canal", data.channel]);
  if (data.delivery) metaRows.push(["Entrega", data.delivery]);

  const metaHtml = metaRows
    .map(([label, value]) => `<div class="row"><span class="label">${esc(label)}</span><span>${esc(value)}</span></div>`)
    .join("");

  const contactHtml = [
    `<div class="row"><span class="label">Cliente</span><span>${esc(data.customerName)}</span></div>`,
    `<div class="row"><span class="label">Teléfono</span><span>${esc(data.customerPhone)}</span></div>`,
  ].join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Factura ${esc(data.invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e5e7eb; }
  body {
    font-family: ui-monospace, "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "Courier New", monospace;
    color: #000;
  }
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 10;
    display: flex; gap: 8px; justify-content: center; align-items: center;
    padding: 10px; background: #111827;
  }
  .toolbar button {
    font: inherit; font-size: 13px; font-weight: 600;
    padding: 8px 16px; border: 0; border-radius: 6px; cursor: pointer;
    background: #f9fafb; color: #111827;
  }
  .toolbar button.primary { background: #10b981; color: #04291c; }
  .paper {
    width: ${paper}mm;
    margin: 64px auto;
    padding: 4mm 3mm;
    background: #fff;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  }
  .receipt { font-size: 11px; line-height: 1.45; }
  .center { text-align: center; }
  .store { font-size: 18px; font-weight: 700; letter-spacing: 2px; }
  .tagline { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; }
  .label { color: #444; text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row > span:last-child { text-align: right; word-break: break-word; }
  .dashes { border-top: 1px dashed #000; margin: 6px 0; }
  .section-title { text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  .item { margin: 7px 0; }
  .item-name { font-weight: 700; word-break: break-word; }
  .item-calc { display: flex; justify-content: space-between; font-size: 10.5px; padding-left: 6px; }
  .totals { margin-top: 6px; }
  .total-row { display: flex; justify-content: space-between; font-size: 11px; }
  .total-row.grand {
    margin-top: 5px; padding-top: 5px; border-top: 1px solid #000;
    font-size: 15px; font-weight: 700; letter-spacing: .5px;
  }
  .footer { margin-top: 10px; text-align: center; font-size: 10.5px; letter-spacing: 1px; }
  .footer .note { display: block; margin-top: 3px; font-size: 9px; letter-spacing: 0; color: #333; }

  @page { size: ${paper}mm auto; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .toolbar { display: none !important; }
    .paper { width: auto; margin: 0; padding: 2mm 2.5mm 6mm; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" type="button" onclick="window.print()">Imprimir</button>
    <button type="button" onclick="window.close()">Cerrar</button>
  </div>

  <div class="paper">
    <div class="receipt">
      <header class="center">
        <div class="store">${esc(data.storeName)}</div>
        ${data.storeTagline ? `<div class="tagline">${esc(data.storeTagline)}</div>` : ""}
        ${data.storePhone ? `<div class="tagline">Tel: ${esc(data.storePhone)}</div>` : ""}
      </header>

      <div class="dashes"></div>
      ${metaHtml}
      <div class="dashes"></div>
      ${contactHtml}

      <div class="dashes"></div>
      <div class="section-title">Detalle</div>
      ${itemsHtml}

      <div class="dashes"></div>
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${money(data.subtotal)}</span></div>
        <div class="total-row"><span>${esc(data.taxLabel ?? "IVA")}</span><span>${money(data.tax)}</span></div>
        <div class="total-row grand"><span>TOTAL</span><span>${money(data.total)}</span></div>
      </div>

      <div class="dashes"></div>
      <div class="footer">
        ${esc(data.footer ?? "GRACIAS POR SU COMPRA")}
        <span class="note">Conserve este comprobante · Generado ${esc(data.date)}</span>
      </div>
    </div>
  </div>

  <script>
    (function () {
      var printed = false;
      function doPrint() {
        if (printed) return;
        printed = true;
        window.print();
      }
      window.addEventListener("load", function () {
        ${autoPrint ? "setTimeout(doPrint, 300);" : ""}
      });
      window.addEventListener("afterprint", function () {
        if (window.opener && !window.opener.closed) window.close();
      });
    })();
  </script>
</body>
</html>`;
}

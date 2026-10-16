import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** IVA Colombia, incluido en el precio mostrado (precio final). */
export const IVA_RATE = 0.19;

/** Genera el siguiente número consecutivo de factura: FV-000001. */
export async function nextInvoiceNumber(tx: Tx): Promise<string> {
  const counter = await tx.counter.upsert({
    where: { key: "invoice" },
    create: { key: "invoice", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `FV-${String(counter.value).padStart(6, "0")}`;
}

/**
 * Genera la factura de un pedido a partir de su total (IVA incluido).
 * Idempotente: si ya existe, la devuelve.
 */
export async function generateInvoiceForOrder(tx: Tx, orderId: string) {
  const existing = await tx.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { total: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  const total = Number(order.total);
  const impuestos = Math.round((total - total / (1 + IVA_RATE)) * 100) / 100;
  const numero = await nextInvoiceNumber(tx);

  return tx.invoice.create({
    data: {
      orderId,
      numero,
      status: "EMITIDA",
      total,
      impuestos,
    },
  });
}

/** Marca la factura del pedido como pagada, generándola si hiciera falta. */
export async function markInvoicePaid(tx: Tx, orderId: string) {
  const invoice = await tx.invoice.findUnique({ where: { orderId } });
  if (!invoice) {
    const generated = await generateInvoiceForOrder(tx, orderId);
    return tx.invoice.update({ where: { id: generated.id }, data: { status: "PAGADA" } });
  }
  return tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAGADA" } });
}

/** Anula la factura del pedido si existe. */
export async function annulInvoiceForOrder(tx: Tx, orderId: string) {
  const invoice = await tx.invoice.findUnique({ where: { orderId } });
  if (!invoice || invoice.status === "ANULADA") return invoice;
  return tx.invoice.update({ where: { id: invoice.id }, data: { status: "ANULADA" } });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import type { ReceiptData } from "@/lib/print-invoice";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  WEB: "Web",
  MOSTRADOR: "Mostrador",
};

const DELIVERY_LABELS: Record<string, string> = {
  DOMICILIO: "Domicilio",
  TIENDA: "Tienda",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { prisma } = await import("@/lib/prisma");
    const { buildReceiptHtml, buildThermalReceipt, receiptToLines } = await import(
      "@/lib/print-invoice"
    );
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: { select: { name: true } },
                variant: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const total = Number(invoice.total);
    const tax = Number(invoice.impuestos);
    const subtotal = total - tax;

    const data: ReceiptData = {
      storeName: process.env.NEXT_PUBLIC_STORE_NAME || "ESPLENDIDA",
      storeTagline: "Factura de venta",
      storePhone: process.env.NEXT_PUBLIC_STORE_PHONE,
      invoiceNumber: invoice.numero,
      date: invoice.fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: STATUS_LABELS[invoice.status] ?? invoice.status,
      customerName: invoice.order.customer.name,
      customerPhone: invoice.order.customer.phone,
      channel: CHANNEL_LABELS[invoice.order.canal] ?? invoice.order.canal,
      delivery: DELIVERY_LABELS[invoice.order.entregaMetodo] ?? invoice.order.entregaMetodo,
      items: invoice.order.items.map((item) => ({
        name: item.product.name,
        variant: item.variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: Number(item.priceUnitario),
        lineTotal: Number(item.priceUnitario) * item.quantity,
      })),
      subtotal,
      tax,
      taxLabel: "IVA 19%",
      total,
      footer: "GRACIAS POR SU COMPRA",
    };

    if (req.nextUrl.searchParams.get("raw") === "1") {
      const receipt = buildThermalReceipt(receiptToLines(data), { width: 32, cut: true });
      return new NextResponse(receipt, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const html = buildReceiptHtml(data, { paper: 58, autoPrint: true });
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("print error", error);
    return NextResponse.json({ error: "Error al generar impresión" }, { status: 500 });
  }
}

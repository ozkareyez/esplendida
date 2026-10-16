import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        invoice: true,
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const headers = ["Fecha", "PedidoId", "Canal", "Entrega", "Estado", "Cliente", "Telefono", "Ciudad", "Factura", "FacturaEstado", "Total", "Impuestos", "Producto", "Variante", "Cantidad", "PrecioUnit", "Subtotal"];
    const rows: string[][] = [];
    for (const o of orders) {
      const base = [
        o.createdAt.toISOString(),
        o.id,
        o.canal,
        o.entregaMetodo,
        o.status,
        o.customer.name,
        o.customer.phone,
        o.customer.city || "",
        o.invoice?.numero || "",
        o.invoice?.status || "",
        Number(o.total).toString(),
        o.invoice ? Number(o.invoice.impuestos).toString() : "",
      ];
      if (o.items.length === 0) {
        rows.push([...base, "", "", "", "", ""]);
      } else {
        for (const it of o.items) {
          rows.push([
            ...base,
            it.product.name,
            it.variant?.name || "",
            it.quantity.toString(),
            Number(it.priceUnitario).toString(),
            (Number(it.priceUnitario) * it.quantity).toString(),
          ]);
        }
      }
    }
    const csv = [headers.join(","), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ventas.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

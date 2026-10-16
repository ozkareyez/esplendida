import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);
    const movs = await prisma.inventoryMovement.findMany({
      include: {
        variant: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const headers = ["Fecha", "Tipo", "SKU", "Producto", "Variante", "Cantidad", "StockDespues", "Motivo", "Pedido"];
    const rows = movs.map((m) => [
      m.createdAt.toISOString(),
      m.type,
      m.variant.sku,
      m.variant.product.name,
      m.variant.name,
      m.quantity.toString(),
      m.stockAfter.toString(),
      m.motivo || "",
      m.orderId || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="movimientos.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

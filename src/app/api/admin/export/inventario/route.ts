import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { prisma } = await import("@/lib/prisma");
    const variants = await prisma.productVariant.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["SKU", "Producto", "Variante", "Precio", "Stock", "StockMinimo", "Slug"];
    const rows = variants.map((v) => [
      v.sku,
      v.product.name,
      v.name,
      Number(v.price).toString(),
      v.stock.toString(),
      v.minStock.toString(),
      v.product.slug,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="inventario.csv"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}

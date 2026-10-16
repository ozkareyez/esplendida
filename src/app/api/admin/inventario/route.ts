import { NextResponse } from "next/server";
import type { InventoryVariant } from "@/lib/admin-types";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const variants = await prisma.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    const payload: InventoryVariant[] = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      name: v.name,
      price: Number(v.price),
      stock: v.stock,
      minStock: v.minStock,
      product: v.product,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/inventario error:", error);
    return NextResponse.json({ error: "No se pudo cargar el inventario" }, { status: 500 });
  }
}

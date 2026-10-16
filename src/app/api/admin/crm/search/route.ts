import { NextRequest, NextResponse } from "next/server";
import type { InventoryVariant } from "@/lib/admin-types";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q) return NextResponse.json([]);

    const { prisma } = await import("@/lib/prisma");
    const variants = await prisma.productVariant.findMany({
      where: {
        OR: [
          { barcode: { equals: q } },
          { sku: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { product: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 15,
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
      orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
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
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}

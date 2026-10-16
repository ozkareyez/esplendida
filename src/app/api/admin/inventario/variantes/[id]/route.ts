import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    const body = await req.json();
    const { sku, name, price, minStock, barcode } = body;

    const data: Prisma.ProductVariantUpdateInput = {};
    if (typeof sku === "string" && sku.trim()) data.sku = sku.trim();
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (price !== undefined && price !== null) data.price = Number(price);
    if (minStock !== undefined && minStock !== null) data.minStock = Number(minStock);

    const nextBarcode =
      typeof barcode === "string" ? barcode.trim() || null : undefined;
    if (nextBarcode !== undefined) data.barcode = nextBarcode;

    if (nextBarcode) {
      const bc = await prisma.productVariant.findFirst({
        where: { barcode: nextBarcode, NOT: { id } },
      });
      if (bc) {
        return NextResponse.json({ error: "El código de barras ya existe" }, { status: 400 });
      }
    }

    const variant = await prisma.productVariant.update({
      where: { id },
      data,
      include: {
        product: { select: { id: true, name: true, slug: true, active: true } },
      },
    });

    return NextResponse.json({
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      name: variant.name,
      price: Number(variant.price),
      stock: variant.stock,
      minStock: variant.minStock,
      product: variant.product,
    });
  } catch (error) {
    console.error("PUT /api/admin/inventario/variantes/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El SKU ya existe" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "No se pudo actualizar la variante" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;

    const orderItems = await prisma.orderItem.count({ where: { variantId: id } });
    if (orderItems > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: la variante tiene pedidos asociados" },
        { status: 400 }
      );
    }

    await prisma.productVariant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/inventario/variantes/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la variante" }, { status: 500 });
  }
}

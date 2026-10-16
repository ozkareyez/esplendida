import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession, requireAdminApi } from "@/lib/auth-guard";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const session = await getSession();
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const { productId, sku, name, price, stock, minStock, barcode } = body;

    if (!productId || !name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (producto, nombre, precio)" },
        { status: 400 }
      );
    }

    const initialStock = Number.isInteger(Number(stock)) ? Number(stock) : 0;
    if (initialStock < 0) {
      return NextResponse.json({ error: "El stock no puede ser negativo" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const finalSku = typeof sku === "string" && sku.trim() ? sku.trim() : `${product.slug}-${slugify(name)}`;
    const existing = await prisma.productVariant.findUnique({ where: { sku: finalSku } });
    if (existing) {
      return NextResponse.json({ error: "El SKU ya existe" }, { status: 400 });
    }

    const finalBarcode = typeof barcode === "string" && barcode.trim() ? barcode.trim() : null;
    if (finalBarcode) {
      const bc = await prisma.productVariant.findUnique({ where: { barcode: finalBarcode } });
      if (bc) {
        return NextResponse.json({ error: "El código de barras ya existe" }, { status: 400 });
      }
    }

    const variant = await prisma.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId,
          sku: finalSku,
          barcode: finalBarcode,
          name,
          price: Number(price),
          stock: 0,
          minStock: Number(minStock) || 0,
        },
      });

      if (initialStock > 0) {
        const { applyStockMovement } = await import("@/lib/inventory");
        await applyStockMovement(tx, {
          variantId: created.id,
          type: "ENTRADA",
          delta: initialStock,
          motivo: "Stock inicial",
          createdById: session?.user.id ?? null,
        });
        return { ...created, stock: initialStock };
      }

      return created;
    });

    return NextResponse.json(
      {
        id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        name: variant.name,
        price: Number(variant.price),
        stock: variant.stock,
        minStock: variant.minStock,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/inventario/variantes error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El SKU ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear la variante" }, { status: 500 });
  }
}

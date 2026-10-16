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
    const { name, slug, description, price, images, active, featured, brandId, categoryId } = body;

    const barcode =
      typeof body.barcode === "string" && body.barcode.trim() ? body.barcode.trim() : undefined;
    const minStock =
      body.minStock !== undefined && body.minStock !== null ? Number(body.minStock) : undefined;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description: description === undefined ? undefined : description || null,
          price: price !== undefined && price !== null ? Number(price) : undefined,
          images: Array.isArray(images) ? images : undefined,
          active: typeof active === "boolean" ? active : undefined,
          featured: typeof featured === "boolean" ? featured : undefined,
          brandId: brandId || undefined,
          categoryId: categoryId || undefined,
        },
        include: {
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      });

      if (barcode !== undefined || minStock !== undefined) {
        const first = await tx.productVariant.findFirst({
          where: { productId: id },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (first) {
          await tx.productVariant.update({
            where: { id: first.id },
            data: {
              barcode: barcode === undefined ? undefined : barcode || null,
              minStock,
            },
          });
        }
      }

      return updated;
    });

    const v = (
      await prisma.productVariant.findFirst({
        where: { productId: id },
        orderBy: { createdAt: "asc" },
        select: { sku: true, barcode: true, stock: true, minStock: true },
      })
    ) ?? { sku: "", barcode: "", stock: 0, minStock: 0 };

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      images: product.images,
      active: product.active,
      featured: product.featured,
      brand: product.brand,
      category: product.category,
      brandId: product.brandId,
      categoryId: product.categoryId,
      sku: v.sku,
      barcode: v.barcode ?? "",
      stock: v.stock,
      minStock: v.minStock,
    });
  } catch (error) {
    console.error("PUT /api/admin/productos/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "No se pudo actualizar el producto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/productos/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo eliminar el producto" }, { status: 500 });
  }
}

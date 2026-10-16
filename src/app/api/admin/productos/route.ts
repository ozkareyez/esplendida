import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        variants: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { sku: true, barcode: true, stock: true, minStock: true },
        },
      },
    });
    return NextResponse.json(
      products.map((p) => {
        const v = p.variants[0];
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          images: p.images,
          active: p.active,
          featured: p.featured,
          brand: p.brand,
          category: p.category,
          brandId: p.brandId,
          categoryId: p.categoryId,
          sku: v?.sku ?? "",
          barcode: v?.barcode ?? "",
          stock: v?.stock ?? 0,
          minStock: v?.minStock ?? 0,
        };
      })
    );
  } catch (error) {
    console.error("GET /api/admin/productos error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los productos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const { name, slug, description, price, images, active, featured, brandId, categoryId, barcode } = body;

    if (!name || !slug || !brandId || !categoryId || price === undefined || price === null) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    if (barcode && typeof barcode === "string") {
      const { prisma: prismaCheck } = await import("@/lib/prisma");
      const exists = await prismaCheck.productVariant.findUnique({ where: { barcode: barcode.trim() } });
      if (exists) {
        return NextResponse.json({ error: "El código de barras ya existe" }, { status: 400 });
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          slug,
          description: description || null,
          price: Number(price),
          images: Array.isArray(images) ? images : [],
          active: Boolean(active),
          featured: Boolean(featured),
          brandId,
          categoryId,
        },
        include: {
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      });

      const baseSku = `${created.slug}-unico`;
      const skuTaken = await tx.productVariant.findUnique({ where: { sku: baseSku } });
      const variant = await tx.productVariant.create({
        data: {
          productId: created.id,
          sku: skuTaken ? `${baseSku}-${created.id.slice(0, 8)}` : baseSku,
          barcode: typeof body.barcode === "string" && body.barcode.trim() ? body.barcode.trim() : null,
          name: "Único",
          price: Number(price),
          stock: Number(body.stock) || 0,
          minStock: Number(body.minStock) || 0,
        },
      });

      return { product: created, variant };
    });

    return NextResponse.json(
      {
        id: product.product.id,
        name: product.product.name,
        slug: product.product.slug,
        description: product.product.description,
        price: Number(product.product.price),
        images: product.product.images,
        active: product.product.active,
        featured: product.product.featured,
        brand: product.product.brand,
        category: product.product.category,
        brandId: product.product.brandId,
        categoryId: product.product.categoryId,
        sku: product.variant.sku,
        barcode: product.variant.barcode ?? "",
        stock: product.variant.stock,
        minStock: product.variant.minStock,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/productos error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 });
  }
}

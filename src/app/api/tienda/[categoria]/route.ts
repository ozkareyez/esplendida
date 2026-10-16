import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoria: string }> }
) {
  const { categoria } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const marca = searchParams.get("marca");
    const precioMin = searchParams.get("precioMin");
    const precioMax = searchParams.get("precioMax");
    const ordenar = searchParams.get("ordenar") || "novedad";

    const where: Prisma.ProductWhereInput = {
      category: { slug: categoria },
      active: true,
    };

    if (marca) where.brand = { slug: marca };
    if (precioMin || precioMax) {
      where.price = {};
      if (precioMin) where.price.gte = parseFloat(precioMin);
      if (precioMax) where.price.lte = parseFloat(precioMax);
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (ordenar === "precio-asc") orderBy = { price: "asc" };
    if (ordenar === "precio-desc") orderBy = { price: "desc" };
    if (ordenar === "nombre-asc") orderBy = { name: "asc" };

    const [category, brands, products] = await Promise.all([
      prisma.category.findUnique({
        where: { slug: categoria },
        select: { name: true, slug: true, description: true, imageUrl: true },
      }),
      prisma.brand.findMany({
        where: {
          products: { some: { category: { slug: categoria }, active: true } },
        },
        orderBy: { name: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.product.findMany({
        where,
        orderBy,
        include: {
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { variants: true } },
        },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      category,
      brands,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        images: p.images,
        brand: p.brand,
        category: p.category,
        active: p.active,
        hasVariants: p._count.variants > 0,
      })),
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/tienda/[categoria] error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los productos" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    const product = await prisma.product.findUnique({
      where: { slug, active: true },
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        variants: {
          select: { id: true, sku: true, name: true, price: true, stock: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ product: null }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        images: product.images,
        brand: product.brand,
        category: product.category,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: Number(v.price),
          stock: v.stock,
        })),
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/producto/[slug] error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el producto" },
      { status: 500 }
    );
  }
}

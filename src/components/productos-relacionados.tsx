import { ProductCard, type ProductCardData } from "@/components/product-card";

async function getRandomProducts(excludeSlug: string): Promise<ProductCardData[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const products = await prisma.product.findMany({
      where: { active: true, slug: { not: excludeSlug } },
      include: { brand: { select: { name: true } } },
    });

    return products
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        images: p.images,
        brand: { name: p.brand.name },
      }));
  } catch (error) {
    console.warn(
      "Usando productos relacionados vacíos:",
      error instanceof Error ? error.message : "error"
    );
    return [];
  }
}

export default async function ProductosRelacionados({ excludeSlug }: { excludeSlug: string }) {
  const products = await getRandomProducts(excludeSlug);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border bg-background py-14 lg:py-20">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-8 text-center lg:mb-12">
          <p className="text-caption mb-2 text-primary">Descubre más</p>
          <h2 className="text-h2">
            Podría <span className="text-primary">interesarte</span>
          </h2>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4 xl:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}

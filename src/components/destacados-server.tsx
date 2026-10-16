import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";


interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  active: boolean;
}

async function getDestacados(): Promise<Product[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const include = {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    };
    const map = (p: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      price: unknown;
      images: string[];
      brand: { name: string; slug: string };
      category: { name: string; slug: string };
      active: boolean;
    }): Product => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      images: p.images,
      brand: p.brand,
      category: p.category,
      active: p.active,
    });

    let products = await prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: { createdAt: "desc" },
      include,
      take: 4,
    });

    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include,
        take: 4,
      });
    }

    return products.map(map);
  } catch (error) {
    console.error(
      "No se pudieron cargar los productos destacados:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export default async function DestacadosServer() {
  const products = await getDestacados();

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="text-caption mb-3 text-primary animate-fade-in">Destacados</p>
          <h2 className="text-h2 animate-fade-in stagger-1">
            Nuestros <span className="text-primary">favoritos</span>
          </h2>
          <p className="text-body mt-4 text-muted-foreground animate-fade-in stagger-2">
            Los productos más vendidos y recomendados por nuestra comunidad
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4 xl:gap-6">
          {products.map((product, index) => (
            <li key={product.id} className="group animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.04, 0.28)}s` }}>
              <article className="card-elevated flex h-full flex-col">
                <Link
                  href={`/producto/${product.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={product.name}
                >
                  <div className="img-zoom-container relative aspect-square bg-muted">
                    {product.images.length > 0 ? (
                      <Image src={product.images[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ShoppingCart className="h-10 w-10" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-caption mb-1.5 truncate text-muted-foreground">{product.brand.name}</p>
                  <h3 className="clamp-2 text-body-sm font-semibold leading-snug">
                    <Link href={`/producto/${product.slug}`} className="transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary">
                      {product.name}
                    </Link>
                  </h3>

                  <div className="mt-auto flex flex-col gap-3 pt-3">
                    <span className="text-price text-primary">${product.price.toLocaleString("es-CO")}</span>
                    <Link
                      href={`/producto/${product.slug}`}
                      className="h-10 w-full gap-1.5 inline-flex items-center justify-center rounded-lg border border-primary/30 bg-background hover:bg-primary hover:text-primary-foreground text-body-sm font-semibold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Ver producto
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

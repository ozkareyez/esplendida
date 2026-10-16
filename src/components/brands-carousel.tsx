import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}

async function getBrands(): Promise<BrandItem[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const brands = await prisma.brand.findMany({
      where: { logoUrl: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    return brands.filter((b): b is BrandItem => b.logoUrl !== null);
  } catch (error) {
    console.error(
      "No se pudieron cargar las marcas:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export async function BrandsCarousel() {
  const brands = await getBrands();

  if (brands.length === 0) return null;

  return (
    <section className="bg-red py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="text-caption mb-3 text-primary animate-fade-in">Marcas aliadas</p>
          <h2 className="text-h2 animate-fade-in stagger-1">
            Marcas que <span className="text-primary">confían en nosotros</span>
          </h2>
          <p className="text-body mt-4 text-muted-foreground animate-fade-in stagger-2">
            Trabajamos directamente con los distribuidores oficiales para traerte
            calidad garantizada
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-5 sm:grid-cols-6 sm:gap-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/marcas/${brand.slug}`}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              aria-label={`Ver productos de la marca ${brand.name}`}
            >
              <article className="relative">
                <div className="relative mx-auto flex aspect-square w-full max-w-[160px] items-center justify-center p-4">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    width={160}
                    height={160}
                    sizes="(max-width: 640px) 45vw, 25vw"
                  />
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in stagger-3">
          <Link
            href="/marcas"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-body-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ver todas las marcas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

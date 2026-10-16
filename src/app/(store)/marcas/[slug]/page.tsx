import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ProductCard, type ProductCardData } from "@/components/product-card";

// ISR: cada marca se genera bajo demanda y se sirve desde caché 60 segundos.
export const revalidate = 60;

interface BrandPageData {
  name: string;
  description: string | null;
  logoUrl: string | null;
  products: ProductCardData[];
}

const getBrand = cache(async (slug: string): Promise<BrandPageData | null> => {
  try {
    const { prisma } = await import("@/lib/prisma");
    const brand = await prisma.brand.findUnique({
      where: { slug },
      select: {
        name: true,
        description: true,
        logoUrl: true,
        products: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            brand: { select: { name: true } },
          },
        },
      },
    });
    if (!brand) return null;

    return {
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logoUrl,
      products: brand.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        images: p.images,
        brand: p.brand,
      })),
    };
  } catch (error) {
    console.error(
      "No se pudo cargar la marca:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) return { title: "Marca no encontrada" };
  return {
    title: brand.name,
    description:
      brand.description?.trim() ||
      `Descubre todos los productos de ${brand.name} disponibles en Espléndida Makeup.`,
  };
}

export default async function MarcaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const count = brand.products.length;

  return (
    <>
      <PageHero
        eyebrow="Marca"
        title={brand.name}
        description={
          brand.description?.trim() || `Selección oficial de ${brand.name} en Espléndida Makeup.`
        }
        breadcrumb={[
          { label: "Inicio", href: "/" },
          { label: "Marcas", href: "/marcas" },
          { label: brand.name },
        ]}
      />

      <section className="container mx-auto px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {brand.logoUrl && (
              <span className="flex h-16 w-24 items-center justify-center rounded-lg border border-border bg-white p-2">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={96}
                  height={60}
                  className="max-h-12 w-auto object-contain"
                />
              </span>
            )}
            {count > 0 && (
              <p className="text-body-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{count}</span>{" "}
                {count === 1 ? "producto disponible" : "productos disponibles"}
              </p>
            )}
          </div>

          <Link
            href="/marcas"
            className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ver todas las marcas
          </Link>
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
              <PackageSearch className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-h3">Todavía no hay productos de {brand.name}</h2>
            <p className="text-body-sm max-w-md text-muted-foreground">
              Estamos reponiendo esta marca. Mientras tanto, explora el resto del catálogo.
            </p>
            <Link href="/tienda" className="btn-primary mt-2">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4 xl:gap-6">
            {brand.products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

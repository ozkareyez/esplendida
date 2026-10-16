import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ComingSoon } from "@/components/coming-soon";
import { BrandsExplorer, type BrandCardData } from "@/components/brands-explorer";

// ISR: el catálogo de marcas se sirve desde la caché del edge y se
// regenera como máximo cada 60 segundos.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Nuestras marcas",
  description:
    "Marcas de belleza aliadas de Espléndida: maquillaje, cuidado facial, corporal y capilar de distribuidores oficiales y 100% originales.",
};

async function getBrands(): Promise<BrandCardData[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        products: {
          where: { active: true },
          select: { category: { select: { slug: true, name: true } } },
        },
      },
    });

    return brands.map((brand) => {
      const categories = new Map<string, string>();
      brand.products.forEach((p) => {
        if (p.category) categories.set(p.category.slug, p.category.name);
      });
      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        description: brand.description,
        productCount: brand.products.length,
        categories: Array.from(categories, ([slug, name]) => ({ slug, name })),
      };
    });
  } catch (error) {
    console.error(
      "No se pudieron cargar las marcas:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

const SEALS = [
  {
    icon: ShieldCheck,
    title: "Distribuidor autorizado",
    text: "Compramos directamente a distribuidores oficiales, sin intermediarios.",
  },
  {
    icon: BadgeCheck,
    title: "Productos 100% originales",
    text: "Cada referencia se verifica y llega sellada desde su fabricante.",
  },
  {
    icon: Sparkles,
    title: "Garantía de autenticidad",
    text: "Si algo no es genuino, lo resolvemos con reposición o devolución.",
  },
];

export default async function MarcasPage() {
  const brands = await getBrands();
  const featured = [...brands]
    .filter((b) => b.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);

  return (
    <>
      <PageHero
        eyebrow="Aliadas"
        title="Nuestras marcas"
        description="Trabajamos de la mano con los fabricantes y distribuidores oficiales para garantizar la máxima calidad y autenticidad en cada producto."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Marcas" }]}
      />

      {brands.length === 0 ? (
        <ComingSoon message="Estamos preparando el catálogo de marcas aliadas." />
      ) : (
        <>
          {brands.length > 6 && (
            <section className="border-b border-border bg-primary-lighter/40 py-12 lg:py-16">
              <div className="container mx-auto px-4 lg:px-6">
                <div className="mx-auto mb-8 max-w-2xl text-center lg:mb-10">
                  <p className="text-caption mb-3 text-primary">Destacadas</p>
                  <h2 className="text-h2">Marcas destacadas</h2>
                  <p className="text-body mt-3 text-muted-foreground">
                    Las marcas que hoy tienen el catálogo más amplio en la tienda.
                  </p>
                </div>
                <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  {featured.map((brand) => (
                    <li key={brand.id}>
                      <Link
                        href={`/marcas/${brand.slug}`}
                        aria-label={`Ver productos de ${brand.name}`}
                        className="group flex h-24 w-32 items-center justify-center rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        {brand.logoUrl ? (
                          <Image
                            src={brand.logoUrl}
                            alt={brand.name}
                            width={120}
                            height={72}
                            className="max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            sizes="128px"
                          />
                        ) : (
                          <span
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-lighter text-h3 font-bold text-primary"
                            aria-hidden="true"
                          >
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <BrandsExplorer brands={brands} />

          <section className="border-t border-border bg-background py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-12">
                <p className="text-caption mb-3 text-primary">Confianza</p>
                <h2 className="text-h2">Compra con seguridad</h2>
              </div>
              <ul className="grid gap-6 sm:grid-cols-3 lg:gap-8">
                {SEALS.map((seal) => {
                  const Icon = seal.icon;
                  return (
                    <li
                      key={seal.title}
                      className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]"
                    >
                      <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <h3 className="text-body font-semibold text-foreground">{seal.title}</h3>
                      <p className="text-body-sm mt-2 text-muted-foreground">{seal.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}

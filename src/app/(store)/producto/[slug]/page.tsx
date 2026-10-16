import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { ProductDetailClient, type ProductDetail } from "./product-detail-client";
import ProductosRelacionados from "@/components/productos-relacionados";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

// ISR: la ficha del producto se sirve desde caché y se regenera cada 60 s.
export const revalidate = 60;

const getProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
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

  if (!product) return null;

  return {
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
  };
});

function absoluteImage(src: string): string {
  try {
    return new URL(src, SITE_URL).toString();
  } catch {
    return src;
  }
}

function buildDescription(product: ProductDetail): string {
  const raw = product.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (raw) return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
  return `Compra ${product.name} de ${product.brand.name} en ${SITE_NAME}. Envíos a todo el país.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let product: ProductDetail | null = null;
  try {
    product = await getProduct(slug);
  } catch (error) {
    console.error("Error generando metadata del producto:", slug, error);
    return { title: "Producto no disponible" };
  }

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const description = buildDescription(product);
  const path = `/producto/${product.slug}`;
  const images = product.images.length > 0 ? product.images.map(absoluteImage) : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: path,
      images: images?.map((url) => ({ url, alt: product.name })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: images?.slice(0, 1),
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;

  let product: ProductDetail | null;
  try {
    product = await getProduct(slug);
  } catch (error) {
    console.error("Error cargando el producto:", slug, error);
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-h1 mb-4">Producto no disponible</h1>
        <p className="text-body text-muted-foreground">
          No pudimos cargar este producto en este momento. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const prices = product.variants.length > 0 ? product.variants.map((v) => v.price) : [product.price];
  const hasStock =
    product.variants.length === 0 || product.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: buildDescription(product),
    image: product.images.map(absoluteImage),
    sku: product.variants[0]?.sku ?? product.id,
    brand: { "@type": "Brand", name: product.brand.name },
    category: product.category.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: hasStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/producto/${product.slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: `${SITE_URL}/tienda/${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/producto/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductDetailClient initialProduct={product} />
      <ProductosRelacionados excludeSlug={product.slug} />
    </>
  );
}

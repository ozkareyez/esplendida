import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ categoria: string }>;
}

const getCategory = cache(async (slug: string) => {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        visible: true,
      },
    });
  } catch (error) {
    console.error(
      "Error cargando categoría para metadata:",
      slug,
      error instanceof Error ? error.message : error
    );
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategory(categoria);

  if (!category) return { title: "Tienda" };

  const description =
    category.description ?? `Explora la categoría ${category.name} en ${SITE_NAME}.`;
  const path = `/tienda/${category.slug}`;

  return {
    title: category.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: category.name,
      description,
      url: path,
      images: category.imageUrl
        ? [{ url: category.imageUrl, alt: category.name }]
        : undefined,
    },
  };
}

export default async function CategoriaLayout({
  params,
  children,
}: {
  params: Promise<{ categoria: string }>;
  children: React.ReactNode;
}) {
  const { categoria } = await params;
  const category = await getCategory(categoria);
  const name = category?.name ?? categoria;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tienda", item: `${SITE_URL}/tienda` },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: `${SITE_URL}/tienda/${categoria}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/tienda", priority: 0.9 },
  { path: "/marcas", priority: 0.7 },
  { path: "/servicios", priority: 0.8 },
  { path: "/nosotros", priority: 0.6 },
  { path: "/contacto", priority: 0.6 },
  { path: "/legal/privacidad", priority: 0.3 },
  { path: "/legal/terminos", priority: 0.3 },
  { path: "/politicas/cambios", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { visible: true, parentId: null },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/tienda/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticEntries, ...categoryEntries, ...productEntries];
  } catch (error) {
    console.error(
      "No se pudo generar el sitemap dinámico, se usan solo las rutas estáticas:",
      error instanceof Error ? error.message : error
    );
    return staticEntries;
  }
}

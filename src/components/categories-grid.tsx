import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

async function getCategories(): Promise<CategoryCard[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    return await prisma.category.findMany({
      where: { parentId: null, visible: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true },
    });
  } catch (error) {
    console.error(
      "No se pudieron cargar las categorías:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export async function CategoriesGrid() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Encabezado de sección */}
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="text-caption mb-3 text-primary animate-fade-in">Categorías</p>
          <h2 className="text-h2 animate-fade-in stagger-1">
            Encuentra lo que{" "}
            <span className="text-primary">necesitas</span>
          </h2>
          <p className="text-body mt-4 text-muted-foreground animate-fade-in stagger-2">
            Seleccionamos cuidadosamente cada producto para tu rutina de belleza
          </p>
        </div>

        {/* Retícula — DESIGN.md §26 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tienda/${category.slug}`}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <article className="card-elevated relative aspect-[4/5]">
                <div className="absolute inset-0">
                  <div className="img-zoom-container h-full w-full">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-primary-lighter" aria-hidden="true" />
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/15 to-transparent transition-opacity duration-300 group-hover:from-foreground/65 group-hover:via-foreground/20"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 lg:p-7">
                  {category.description && (
                    <p className="text-caption mb-2 text-white/85">{category.description}</p>
                  )}
                  <h3 className="text-h3 text-white">
                    <span className="sr-only">Ver productos de </span>
                    {category.name}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-2 text-body-sm font-semibold text-white">
                    Ver productos
                    <ArrowRight
                      className="h-4 w-4 text-accent transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

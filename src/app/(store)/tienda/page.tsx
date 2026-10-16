import { PageHero } from "@/components/page-hero";
import { CategoriesGrid } from "@/components/categories-grid";

// ISR: las categorías se leen de la base de datos y se sirven desde la caché
// del edge; se regenera como máximo cada 60 segundos.
export const revalidate = 60;

export default function TiendaPage() {
  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Tienda"
        description="Explora maquillaje, skincare y cuidado capilar de nuestras marcas aliadas."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Tienda" }]}
      />
      <CategoriesGrid />
    </>
  );
}

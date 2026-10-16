import { Hero } from "@/components/hero";
import { CategoriesGrid } from "@/components/categories-grid";
import { BrandsCarousel } from "@/components/brands-carousel";
import { Visitanos } from "@/components/visitanos";
import DestacadosServer from "@/components/destacados-server";

// ISR: los destacados y marcas se leen de la base de datos y se sirven
// desde la caché del edge; se regenera como máximo cada 60 segundos.
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Hero />
      <CategoriesGrid />
      <DestacadosServer />
      <BrandsCarousel />
      <Visitanos />
    </>
  );
}

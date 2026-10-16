import { PageHero } from "@/components/page-hero";
import { ComingSoon } from "@/components/coming-soon";

export default function CambiosPage() {
  return (
    <>
      <PageHero
        eyebrow="Ayuda"
        title="Políticas de Cambios"
        description="Queremos que quedes feliz con tu compra."
        breadcrumb={[
          { label: "Inicio", href: "/" },
          { label: "Políticas de Cambios" },
        ]}
      />
      <ComingSoon message="Estamos redactando nuestra política de cambios y devoluciones." />
    </>
  );
}

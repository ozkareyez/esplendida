import { PageHero } from "@/components/page-hero";
import { ComingSoon } from "@/components/coming-soon";

export default function TerminosPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Términos y Condiciones"
        description="Las reglas que rigen el uso de nuestra tienda y tus compras."
        breadcrumb={[
          { label: "Inicio", href: "/" },
          { label: "Términos y Condiciones" },
        ]}
      />
      <ComingSoon message="Estamos redactando nuestros términos y condiciones." />
    </>
  );
}

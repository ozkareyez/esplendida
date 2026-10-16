import { PageHero } from "@/components/page-hero";
import { ComingSoon } from "@/components/coming-soon";

export default function PrivacidadPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Política de Privacidad"
        description="Cómo cuidamos y usamos tus datos personales."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Privacidad" }]}
      />
      <ComingSoon message="Estamos redactando nuestra política de privacidad." />
    </>
  );
}

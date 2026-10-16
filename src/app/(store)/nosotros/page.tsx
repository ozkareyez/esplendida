import { PageHero } from "@/components/page-hero";

const VALUES = [
  {
    title: "Curaduría",
    text: "Elegimos cada producto pensando en resultados reales para tu rutina.",
  },
  {
    title: "Cercanía",
    text: "Te acompañamos por WhatsApp antes, durante y después de tu compra.",
  },
  {
    title: "Confianza",
    text: "Productos originales de marcas aliadas, con envíos a todo el país.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHero
        eyebrow="Nuestra historia"
        title="Nosotros"
        description="Espléndida nace para acercarte lo mejor del maquillaje, el skincare y el cuidado capilar."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Nosotros" }]}
      />

      <section className="bg-background py-14 lg:py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <p className="text-body mx-auto max-w-3xl text-muted-foreground">
            Somos una tienda colombiana de belleza con una idea simple: que
            encuentres productos que de verdad funcionen, de marcas en las que
            puedas confiar, con una experiencia de compra cercana y sin
            complicaciones.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <h2 className="text-h3 text-primary">{value.title}</h2>
                <p className="text-body-sm mt-2 text-muted-foreground">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

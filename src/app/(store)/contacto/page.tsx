import Link from "next/link";
import { MessageCircle, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { whatsappLink } from "@/lib/negocio";

const WHATSAPP_HREF = whatsappLink("Hola Espléndida, me gustaría hacer una consulta.");

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    text: "La forma más rápida. Te respondemos en minutos.",
    action: { label: "Escribir por WhatsApp", href: WHATSAPP_HREF, external: true },
  },
  {
    icon: Clock,
    title: "Horario",
    text: "Lunes a viernes, 9:00 a.m. a 6:00 p.m.",
  },
  {
    icon: MapPin,
    title: "Cobertura",
    text: "Envíos a todo Colombia desde nuestra tienda online.",
  },
];

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Estamos aquí"
        title="Contacto"
        description="¿Tienes dudas sobre un producto o tu pedido? Escríbenos y te ayudamos."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]}
      />

      <section className="bg-background py-14 lg:py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, title, text, action }) => (
              <article
                key={title}
                className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="text-h3">{title}</h2>
                <p className="text-body-sm mt-2 text-muted-foreground">{text}</p>
                {action && (
                  <Link
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noopener noreferrer" : undefined}
                    className="btn-primary mt-5 w-full"
                  >
                    {action.label}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

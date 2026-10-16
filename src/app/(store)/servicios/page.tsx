import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Droplets,
  Eye,
  MapPin,
  Paintbrush,
  Scissors,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { BUSINESS, MAPS_DIRECTIONS_URL, whatsappLink } from "@/lib/negocio";

export const metadata: Metadata = {
  title: "Servicios de belleza",
  description:
    "Limpieza facial, pestañas, diseño de cejas y depilación en el salón Espléndida. Cotiza tu cita por WhatsApp.",
};

const SERVICES = [
  {
    icon: Droplets,
    name: "Limpieza facial",
    description:
      "Protocolo profesional que desintoxica, hidrata y devuelve luz a tu piel: extracción, masaje y mascarilla según tu tipo de rostro.",
    points: ["Diagnóstico de piel", "Extracción de puntos negros", "Mascarilla e hidratación"],
  },
  {
    icon: Eye,
    name: "Pestañas",
    description:
      "Extensiones pelo a pelo, volumen ruso o lifting para una mirada deslumbrante y cómoda, con acabado natural o dramático a tu gusto.",
    points: ["Pelo a pelo y volumen ruso", "Lifting y tinte", "Sellado de larga duración"],
  },
  {
    icon: Paintbrush,
    name: "Diseño de cejas",
    description:
      "Armonizamos la forma de tus cejas con tu rostro usando depilación, microblading o delineado para un marco perfecto.",
    points: ["Depilación con hilo y cera", "Micropigmentación", "Delineado natural"],
  },
  {
    icon: Scissors,
    name: "Depilación",
    description:
      "Depilación corporal con cera caliente o fría en zonas faciales y corporales, con productos amables para pieles sensibles.",
    points: ["Rostro, axilas y piernas", "Zona íntima", "Cuidado post-depilación"],
  },
];

export default function ServiciosPage() {
  return (
    <>
      <PageHero
        eyebrow="El salón"
        title="Servicios de belleza"
        description="Además de nuestra tienda, en Espléndida realizamos tratamientos faciales, pestañas, cejas y depilación con manos expertas y productos de calidad."
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Servicios" }]}
      />

      <section className="container mx-auto px-4 py-14 lg:px-6 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.name}
                className="card-elevated flex flex-col p-6 lg:p-8"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-lighter text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <h2 className="text-h3 mt-5 font-bold text-foreground">{service.name}</h2>
                <p className="text-body-sm mt-2 text-muted-foreground">{service.description}</p>

                <ul className="mt-5 flex flex-col gap-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-body-sm text-foreground/80">
                      <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(`Hola Espléndida, quiero cotizar el servicio de ${service.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-1.5 self-start text-body-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Cotizar por WhatsApp
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>

        {/* Banda de cierre: ubicación + agenda */}
        <div className="mt-10 flex flex-col items-start gap-6 rounded-2xl border border-border bg-primary-lighter/40 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-body font-semibold text-foreground">Te atendemos en el salón</p>
              <p className="text-body-sm mt-0.5 text-muted-foreground">
                {BUSINESS.address}
                {BUSINESS.city ? `, ${BUSINESS.city}` : ""}
                {BUSINESS.schedule ? ` · ${BUSINESS.schedule}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappLink("Hola Espléndida, quiero agendar una cita.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex min-h-11 items-center gap-2"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              Agendar cita
            </a>
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex min-h-11 items-center gap-2"
            >
              Cómo llegar
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tienda"
            className="inline-flex min-h-11 items-center gap-1.5 text-body-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ver los productos que usamos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

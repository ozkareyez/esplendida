import Link from "next/link";
import Image from "next/image";
import { cloudinary, IMG } from "@/lib/cdn";
import {
  InstagramIcon,
  TikTokIcon,
  FacebookIcon,
  WhatsAppIcon,
} from "@/components/social-icons";
import { SOCIAL_PROFILES } from "@/lib/negocio";

const COLUMNS = [
  {
    title: "Tienda",
    links: [
      { label: "Maquillaje", href: "/tienda/maquillaje" },
      { label: "Skincare", href: "/tienda/skincare" },
      { label: "Cuidado Capilar", href: "/tienda/capilar" },
      { label: "Marcas Aliadas", href: "/marcas" },
      { label: "Servicios de salón", href: "/servicios" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Sobre Nosotros", href: "/nosotros" },
      { label: "Contacto", href: "/contacto" },
      { label: "Políticas de Cambios", href: "/politicas/cambios" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y Condiciones", href: "/legal/terminos" },
      { label: "Política de Privacidad", href: "/legal/privacidad" },
    ],
  },
];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573000000000";

const SOCIALS = [
  { label: "Facebook", href: SOCIAL_PROFILES.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: SOCIAL_PROFILES.instagram, Icon: InstagramIcon },
  { label: "TikTok", href: SOCIAL_PROFILES.tiktok, Icon: TikTokIcon },
  { label: "WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}`, Icon: WhatsAppIcon },
];

const LINK_BASE =
  "inline-flex min-h-10 items-center text-body-sm text-foreground/75 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary focus-visible:underline focus-visible:underline-offset-4";

const SOCIAL_CHIP_BASE =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-deep shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-[var(--shadow-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:ring-offset-primary-lighter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-primary-lighter text-foreground">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4 py-14 lg:px-6 lg:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          {/* Marca */}
          <div className="lg:max-w-sm">
            <Link
              href="/"
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-lighter"
              aria-label="Espléndida — Inicio"
            >
              <Image
                src={cloudinary(IMG.logo)}
                alt="Espléndida Makeup"
                width={150}
                height={50}
                className="h-auto w-auto max-w-[150px]"
              />
            </Link>
            <p className="text-body-sm mt-5 max-w-xs text-foreground/80">
              Belleza con brillo propio. Maquillaje, skincare y cuidado capilar de
              marcas aliadas.
            </p>

            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={SOCIAL_CHIP_BASE}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de enlaces */}
          <nav
            aria-label="Enlaces del pie de página"
            className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3 lg:gap-x-16"
          >
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="mb-4 text-body-sm font-bold text-primary-deep">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-1">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_BASE}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-dark/20 pt-8 sm:flex-row">
          <p className="text-body-sm text-foreground/70">
            © {currentYear} Espléndida Makeup. Todos los derechos reservados.
          </p>
          <p className="text-body-sm text-foreground/55">
            Hecho con cariño en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}

import { CalendarCheck, Clock, ExternalLink, MapPin } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "@/components/social-icons";
import {
  BUSINESS,
  MAPS_DIRECTIONS_URL,
  MAPS_EMBED_URL,
  SOCIAL_PROFILES,
  TIKTOK_VIDEOS,
  tiktokEmbedId,
  whatsappLink,
} from "@/lib/negocio";

export function Visitanos() {
  const videos = TIKTOK_VIDEOS.map(tiktokEmbedId).filter((id): id is string => Boolean(id));

  return (
    <section id="visitanos" className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-2xl">
          <p className="text-caption mb-3 text-primary">El salón</p>
          <h2 className="text-h2">
            Visítanos en <span className="text-primary">{BUSINESS.name}</span>
          </h2>
          <p className="text-body mt-4 text-muted-foreground">
            Nuestros servicios de belleza se disfrutan también en persona. Pasa a saludarnos,
            agenda tu cita y vive la experiencia completa.
          </p>
        </div>

        {/* Información + mapa */}
        <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
          <div className="card-elevated flex min-w-0 flex-col justify-center gap-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-body font-semibold text-foreground">Dirección</p>
                <p className="text-body-sm mt-0.5 text-muted-foreground">
                  {BUSINESS.address}
                  {BUSINESS.city ? `, ${BUSINESS.city}` : ""}
                </p>
              </div>
            </div>

            {BUSINESS.schedule && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-body font-semibold text-foreground">Horarios</p>
                  <p className="text-body-sm mt-0.5 text-muted-foreground">{BUSINESS.schedule}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <a
                href={whatsappLink("Hola Espléndida, quiero agendar una cita en el salón.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex min-h-12 flex-1 items-center justify-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Agendar cita
              </a>
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex min-h-12 flex-1 items-center justify-center"
              >
                Cómo llegar
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <iframe
              src={MAPS_EMBED_URL}
              title={`Mapa de ubicación de ${BUSINESS.name}`}
              className="h-[320px] w-full min-w-0 rounded-2xl border border-border shadow-[var(--shadow-soft)] lg:h-full lg:min-h-[320px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Videos de las redes */}
        <div className="mt-14 lg:mt-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-h3">
              {videos.length > 0 ? "Échale un ojito" : "Síguenos y mira nuestro trabajo"}
            </h3>
            <a
              href={SOCIAL_PROFILES.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 text-body-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <TikTokIcon className="h-4 w-4" aria-hidden="true" />
              Síguenos en TikTok
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {videos.length > 0 ? (
            <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-3 sm:gap-6">
              {videos.map((id) => (
                <div
                  key={id}
                  className="mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-brand)]"
                >
                  <iframe
                    src={`https://www.tiktok.com/player/v1/${id}?lang=es-ES&description=0&music_info=0&progress_bar=1&autoplay=0`}
                    title="Video de TikTok de Espléndida"
                    className="h-[440px] w-full border-0"
                    loading="lazy"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
                <TikTokIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-body-sm max-w-md text-muted-foreground">
                Aquí pronto mostraremos los mejores videos de nuestros servicios en TikTok.
                Mientras tanto, síguenos para verlos en primera mano.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={SOCIAL_PROFILES.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex min-h-11 items-center gap-2"
                >
                  <TikTokIcon className="h-4 w-4" aria-hidden="true" />
                  Seguir en TikTok
                </a>
                <a
                  href={SOCIAL_PROFILES.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex min-h-11 items-center gap-2"
                >
                  <InstagramIcon className="h-4 w-4" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href={SOCIAL_PROFILES.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex min-h-11 items-center gap-2"
                >
                  Facebook
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

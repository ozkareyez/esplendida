"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER } from "@/lib/negocio";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cloudinary, IMG } from "@/lib/cdn";

type Slide = {
  src: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  href: string;
  cta: string;
};

const SLIDES: Slide[] = [
  {
    src: cloudinary(IMG.landing.hero),
    eyebrow: "Nueva colección",
    title: "Descubre tu",
    highlight: "nuevo look",
    description:
      "Lo último de Purpure y Poción en labiales, sombras y bases. Ya disponible en tienda.",
    href: "/tienda/maquillaje",
    cta: "Ver nueva colección",
  },
  {
    src: cloudinary(IMG.landing.hero2),
    eyebrow: "Cuidado facial",
    title: "Tu piel,",
    highlight: "tus reglas",
    description:
      "Sérums, humectantes y protección solar con hasta 35% de descuento.",
    href: "/tienda/skincare",
    cta: "Ver skincare",
  },
  {
    src: cloudinary(IMG.landing.hero3),
    eyebrow: "Combos y promos",
    title: "Rutinas que",
    highlight: "sí rinden",
    description: "Combos completos de maquillaje y skincare con precio de promoción.",
    href: "/tienda",
    cta: "Ver combos",
  },
  {
    src: cloudinary(IMG.landing.hero4),
    eyebrow: "Cuidado capilar",
    title: "Repara y",
    highlight: "fortalece",
    description: "Shampoos, aceites y máscaras con keratina para tu cabello.",
    href: "/tienda/capilar",
    cta: "Ver capilar",
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "Pago seguro" },
  { icon: Truck, label: "Envío rápido" },
  { icon: RotateCcw, label: "Garantía 30 días" },
];

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola Espléndida, me gustaría conocer sus productos!"
);

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 48;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function Hero() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [explicitPlaying, setExplicitPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);
  /** El usuario pidió reproducir; el hover/foco no debe volver a pausar. */
  const explicitPlay = useRef(false);
  const reducedMotion = usePrefersReducedMotion();

  const paused = reducedMotion || userPaused || (interacting && !explicitPlaying);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const step = useCallback(
    (delta: number) => setIndex((prev) => (prev + delta + SLIDES.length) % SLIDES.length),
    []
  );

  // Autoplay. Depende de `index` para reiniciar el ciclo completo en cada cambio,
  // también al navegar a mano (si no, la nueva diapositiva heredaría el resto
  // del intervalo anterior y podría verse menos de 1 s).
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  const releaseInteraction = () => {
    explicitPlay.current = false;
    setExplicitPlaying(false);
    setInteracting(false);
  };

  const togglePlayback = () => {
    if (userPaused) {
      explicitPlay.current = true;
      setExplicitPlaying(true);
      setUserPaused(false);
    } else {
      setUserPaused(true);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  };

  const slide = SLIDES[index];

  return (
    <section
      className="relative flex flex-col overflow-hidden bg-background lg:min-h-[90svh] lg:items-end lg:justify-end lg:bg-foreground"
      aria-roledescription="carrusel"
      aria-label="Novedades destacadas"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setInteracting(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") releaseInteraction();
      }}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) releaseInteraction();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const delta = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) > SWIPE_THRESHOLD) step(delta < 0 ? 1 : -1);
      }}
    >
      {/* Diapositivas. En móvil es un bloque propio con altura fija (la imagen
          no se tapa con texto); en desktop se comporta como capa absoluta de
          fondo, igual que siempre. */}
      <div className="relative h-[52svh] w-full shrink-0 lg:absolute lg:inset-0 lg:h-auto">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={cn(
              "absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
              i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
            )}
            aria-hidden={i !== index}
          >
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={slide.src}
                alt=""
                aria-hidden="true"
                fill
                priority={i === 0}
                sizes="100vw"
                className={cn(
                  "scale-110 object-cover blur-3xl",
                  i === index && "animate-ken-burns motion-reduce:animate-none"
                )}
              />
            </div>
            <div className="absolute inset-0 flex items-start justify-center lg:items-center">
              <Image
                src={slide.src}
                alt={`${slide.eyebrow}: ${slide.title} ${slide.highlight}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-contain object-top lg:object-contain lg:object-center"
              />
            </div>
          </div>
        ))}

        {/* Scrim — en móvil apenas un degradado inferior para los indicadores;
            el texto ya no vive sobre la foto */}
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-t from-foreground/50 via-foreground/5 to-transparent lg:bg-gradient-to-t lg:from-foreground/80 lg:via-foreground/45 lg:to-foreground/20"
          aria-hidden="true"
        />

        {/* Flechas — 48px, mínimo táctil §27. En móvil se navega con swipe */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Diapositiva anterior"
          className="absolute left-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Diapositiva siguiente"
          className="absolute right-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Indicadores + control de reproducción (WCAG 2.2.2) */}
        <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-1 sm:bottom-5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la diapositiva ${i + 1}: ${slide.eyebrow}`}
              aria-current={i === index}
              className="group inline-flex h-11 w-8 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="relative block h-2.5 w-full overflow-hidden rounded-full bg-white/45 transition-colors duration-200 group-hover:bg-white/70">
                <span
                  className={cn(
                    "absolute inset-0 origin-left rounded-full bg-white",
                    i === index ? "animate-slide-progress" : "scale-x-0",
                    i === index && paused && "[animation-play-state:paused]"
                  )}
                />
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={togglePlayback}
            aria-label={userPaused ? "Reanudar carrusel" : "Pausar carrusel"}
            className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-white/85 transition-colors duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {userPaused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido — en móvil va DEBAJO de la imagen sobre el fondo claro,
          con tipografía menor; en desktop se ancla a la esquina inferior
          derecha sobre la fotografía. La `key` remonta el bloque en cada
          cambio de diapositiva para reproducir la animación. */}
      <div className="container relative z-10 mx-auto flex w-full flex-col items-center px-4 pb-12 pt-7 lg:mt-auto lg:items-end lg:px-6 lg:pb-28 lg:pt-6">
        <div key={slide.src} className="animate-hero-corner w-full max-w-3xl text-center lg:max-w-md lg:text-right">
          <p className="animate-hero-rise rise-1 mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary lg:mb-3 lg:text-white/90">
            {slide.eyebrow}
          </p>

          <h1 className="animate-hero-rise rise-2 mb-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:mb-4 lg:text-[clamp(1.75rem,2.6vw,2.5rem)] lg:leading-[1.15] lg:text-white">
            {slide.title}
            <br />
            <span className="relative inline-block">
              {slide.highlight}
              <span
                className="animate-hero-line rise-3 absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 rounded-full bg-accent"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="animate-hero-rise rise-3 mx-auto mb-7 max-w-xl text-sm leading-relaxed text-muted-foreground lg:mb-6 lg:mx-0 lg:max-w-none lg:text-base lg:text-white/90 lg:leading-normal">
            {slide.description}
          </p>

          <div className="animate-hero-rise rise-4 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-end lg:gap-3">
            <Link href={slide.href} className="w-full sm:w-auto">
              <Button className="h-12 w-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-dark sm:w-auto lg:h-11 lg:bg-white lg:px-6 lg:text-sm lg:text-primary lg:shadow-lg lg:hover:bg-primary-lighter lg:hover:shadow-[0_8px_30px_-8px_rgba(224,72,120,0.4)]">
                {slide.cta}
              </Button>
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="h-12 w-full border-2 border-primary/40 bg-transparent px-6 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary hover:bg-primary/5 sm:w-auto lg:h-11 lg:border-2 lg:border-white lg:px-6 lg:text-sm lg:text-white lg:hover:border-white lg:hover:bg-white/10"
              >
                Pedir por WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <ul className="animate-hero-rise rise-5 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground lg:mt-8 lg:justify-end lg:gap-x-6 lg:text-sm lg:text-white/85">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary lg:h-5 lg:w-5 lg:text-accent" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

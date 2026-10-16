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

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573000000000";
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
      className="relative flex min-h-[88svh] flex-col items-start justify-end overflow-hidden bg-foreground lg:min-h-[90svh] lg:items-end"
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
      {/* Diapositivas. Cada una se compone de dos capas: un fondo desenfocado
          que deriva lentamente (Ken Burns) para dar vida y cubre cualquier banda
          sobrante, y la foto completa sin recortar (`object-contain`), que entra
          con un zoom sutil y queda a escala 1 en reposo. */}
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

      {/* Scrim para legibilidad del texto sobre la fotografía */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-foreground/90 via-foreground/40 to-foreground/10 lg:bg-gradient-to-t lg:from-foreground/80 lg:via-foreground/45 lg:to-foreground/20"
        aria-hidden="true"
      />

      {/* En móvil el contenido va centrado; en desktop se ancla a la esquina
          inferior derecha. La `key` remonta el bloque en cada cambio de
          diapositiva: así el efecto de aparición (`animate-hero-corner`, solo en
          desktop) y el revelado escalonado se reproducen cada vez. */}
      <div className="container relative z-10 mx-auto mt-auto flex w-full flex-col items-center px-4 pb-60 pt-6 lg:items-end lg:px-6 lg:pb-28">
        <div key={slide.src} className="animate-hero-corner w-full max-w-3xl text-center lg:max-w-md lg:text-right">
          <p className="text-caption animate-hero-rise rise-1 mb-3 text-white/90">
            {slide.eyebrow}
          </p>

          <h1 className="text-display hero-corner-title animate-hero-rise rise-2 mb-5 text-white lg:mb-4">
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

          <p className="text-body animate-hero-rise rise-3 mx-auto mb-10 max-w-xl text-base text-white/90 md:text-lg lg:mx-0 lg:mb-6 lg:max-w-none">
            {slide.description}
          </p>

          <div className="animate-hero-rise rise-4 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-end lg:gap-3">
            <Link href={slide.href} className="w-full sm:w-auto">
              <Button className="h-13 w-full bg-white px-8 text-base font-semibold text-primary shadow-lg transition-all duration-200 hover:bg-primary-lighter hover:shadow-[0_8px_30px_-8px_rgba(224,72,120,0.4)] sm:w-auto lg:h-11 lg:px-6 lg:text-sm">
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
                  className="h-13 w-full border-2 border-white bg-transparent px-8 text-base font-semibold text-white transition-all duration-200 hover:border-white hover:bg-white/10 sm:w-auto lg:h-11 lg:px-6 lg:text-sm"
                >
                Pedir por WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <ul className="animate-hero-rise rise-5 mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/85 lg:mt-8 lg:justify-end lg:gap-x-6">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

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
    </section>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ChevronDown } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573126221681";
const MESSAGE = encodeURIComponent("Hola Espléndida, me gustaría hacer un pedido!");
const HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`;

const FAB =
  "relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white " +
  "shadow-[0_4px_20px_-4px_rgba(37,211,102,0.5)] transition-all duration-300 " +
  "hover:scale-105 hover:bg-[#20c558] hover:shadow-[0_8px_30px_-8px_rgba(37,211,102,0.6)] " +
  "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2";

export function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Aparece tras pasar el hero para no competir con el CTA principal
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 240;
      setVisible(atBottom || window.scrollY > window.innerHeight * 0.55);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Contacto por WhatsApp"
    >
      {/* Tarjeta desktop */}
      {expanded && (
        <div
          role="dialog"
          className="pointer-events-auto absolute bottom-20 right-0 hidden w-72 rounded-xl border border-border bg-white p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] animate-slide-up sm:right-6 sm:block"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-h3 text-primary">¿Necesitas ayuda?</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-body-sm mt-2 text-muted-foreground">
            Escríbenos y te respondemos en minutos. Lunes a viernes, 9:00 a.m. a
            6:00 p.m.
          </p>
          <a href={HREF} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Abrir WhatsApp
          </a>
        </div>
      )}

      {/* Tarjeta móvil — DESIGN.md §25 */}
      {!collapsed && (
        <div className="pointer-events-auto border-t border-border bg-white/95 px-4 py-3 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] backdrop-blur sm:hidden animate-slide-up">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"
              aria-hidden="true"
            >
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-foreground">
                ¿Necesitas ayuda?
              </p>
              <p className="clamp-1 text-body-sm text-muted-foreground">
                Habla con nosotros por WhatsApp
              </p>
            </div>
            <a
              href={HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 shrink-0 items-center rounded-lg bg-[#25D366] px-4 text-body-sm font-semibold text-white transition-colors hover:bg-[#20c558] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
            >
              Escribir
            </a>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Ocultar tarjeta de WhatsApp"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <div className="pointer-events-auto flex justify-end px-4 pb-4 sm:bottom-0 sm:right-0 sm:block sm:p-0">
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mr-2 inline-flex h-11 items-center rounded-full bg-white px-4 text-body-sm font-semibold text-[#128C4B] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] sm:hidden"
          >
            ¿Necesitas ayuda?
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={FAB}
          aria-label="Abrir contacto por WhatsApp"
          aria-expanded={expanded}
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

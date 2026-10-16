"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { cloudinary, IMG } from "@/lib/cdn";
import { useCart } from "@/hooks/use-cart";
import { useMounted } from "@/hooks/use-mounted";

const NAV_ITEMS = [
  { label: "Tienda", href: "/tienda" },
  { label: "Maquillaje", href: "/tienda/maquillaje" },
  { label: "Skincare", href: "/tienda/skincare" },
  { label: "Cuidado Capilar", href: "/tienda/capilar" },
  { label: "Marcas", href: "/marcas" },
  { label: "Servicios", href: "/servicios" },
  { label: "Nosotros", href: "/nosotros" },
];

const ICON_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary-lighter/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useMounted();
  const itemCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-primary-lighter/50"
            : "bg-white border-b border-border/70"
        )}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-2 lg:gap-4">
            {/* Menu móvil */}
            <button
              type="button"
              className={cn(ICON_BUTTON, "lg:hidden -ml-2")}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-movil"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="Espléndida — Inicio"
            >
              <Image
                src={cloudinary(IMG.logo)}
                alt="Espléndida Makeup"
                width={150}
                height={50}
                priority
                className="h-auto w-auto max-w-[110px] lg:max-w-[140px]"
              />
            </Link>

            {/* Navegación desktop */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navegación principal">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 xl:px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Link
                href="/contacto"
                className={cn(ICON_BUTTON, "hidden lg:inline-flex")}
                aria-label="Mi cuenta"
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/carrito"
                className={cn(ICON_BUTTON, "relative -mr-2")}
                aria-label={`Carrito de compras${mounted && itemCount > 0 ? `, ${itemCount} productos` : ""}`}
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {mounted && itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer móvil — DESIGN.md §8 (80–90% del ancho) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="menu-movil"
            className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] animate-slide-in-right"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Image
                src={cloudinary(IMG.logo)}
                alt="Espléndida Makeup"
                width={130}
                height={44}
                className="h-auto w-auto max-w-[110px]"
              />
              <button
                type="button"
                className={ICON_BUTTON}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación móvil">
              <ul className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors duration-200 hover:bg-primary-lighter/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-4 border-t border-border" role="presentation" />

              <ul className="flex flex-col gap-0.5">
                <li>
                  <Link
                    href="/carrito"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:bg-primary-lighter/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
                    Mi carrito
                    {mounted && itemCount > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacto"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:bg-primary-lighter/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <User className="h-5 w-5 text-primary" aria-hidden="true" />
                    Mi cuenta
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="shrink-0 border-t border-border p-4">
              <Link
                href="/tienda"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full"
              >
                Ver tienda
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

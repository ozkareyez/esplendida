"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, Search, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BrandCategoryFacet {
  slug: string;
  name: string;
}

export interface BrandCardData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  productCount: number;
  categories: BrandCategoryFacet[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function joinWithY(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function brandTagline(brand: BrandCardData): string {
  if (brand.description?.trim()) return brand.description.trim();
  if (brand.categories.length === 0) return "Distribuidor oficial";
  const names = brand.categories.slice(0, 3).map((c) => c.name);
  return `Disponible en ${joinWithY(names)}`;
}

const letterBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1 text-body-sm font-semibold uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function BrandsExplorer({ brands }: { brands: BrandCardData[] }) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const [category, setCategory] = useState("");

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    brands.forEach((b) => b.categories.forEach((c) => map.set(c.slug, c.name)));
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "es")
    );
  }, [brands]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      const first = b.name.trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) set.add(first);
    });
    return set;
  }, [brands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      if (letter && b.name.trim().charAt(0).toUpperCase() !== letter) return false;
      if (category && !b.categories.some((c) => c.slug === category)) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [brands, query, letter, category]);

  const hasFilters = Boolean(query.trim() || letter || category);

  const clearAll = () => {
    setQuery("");
    setLetter("");
    setCategory("");
  };

  return (
    <section id="explorar" className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-2xl">
          <p className="text-caption mb-3 text-primary">Explora</p>
          <h2 className="text-h2">
            Encuentra tu <span className="text-primary">marca</span>
          </h2>
          <p className="text-body mt-4 text-muted-foreground">
            Busca por nombre, recorre el abecedario o filtra por categoría para llegar a los
            productos de tu marca favorita.
          </p>
        </div>

        {/* Panel de filtros */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5 lg:mt-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar una marca"
                aria-label="Buscar una marca"
                className="input-elegant"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>

            <div className="relative w-full lg:w-64">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar por categoría"
                className="input-elegant cursor-pointer appearance-none"
                style={{ paddingRight: "2.5rem" }}
              >
                <option value="">Todas las categorías</option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setLetter("")}
              aria-pressed={!letter}
              className={cn(
                letterBase,
                !letter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary-lighter hover:text-primary-dark"
              )}
            >
              Todas
            </button>
            {ALPHABET.map((l) => {
              const available = availableLetters.has(l);
              const active = letter === l;
              return (
                <button
                  key={l}
                  type="button"
                  disabled={!available}
                  aria-pressed={active}
                  onClick={() => setLetter(active ? "" : l)}
                  className={cn(
                    letterBase,
                    active
                      ? "bg-primary text-primary-foreground"
                      : available
                        ? "text-foreground hover:bg-primary-lighter hover:text-primary-dark"
                        : "cursor-not-allowed text-muted-foreground/30"
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-body-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> de{" "}
            {brands.length} {brands.length === 1 ? "marca" : "marcas"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-body-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
              <Store className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="text-h3">No encontramos esa marca</h3>
            <p className="text-body-sm max-w-md text-muted-foreground">
              Prueba con otra búsqueda o quita los filtros para ver todo el catálogo de marcas.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="btn-primary mt-2"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((brand, index) => (
              <BrandCard key={brand.id} brand={brand} index={index} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function BrandCard({ brand, index }: { brand: BrandCardData; index: number }) {
  const count = brand.productCount;
  return (
    <li
      className="animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.24)}s` }}
    >
      <article className="card-elevated flex h-full flex-col">
        <Link
          href={`/marcas/${brand.slug}`}
          aria-label={`Ver productos de ${brand.name}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex aspect-[3/2] items-center justify-center bg-white p-6">
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                width={200}
                height={120}
                className="max-h-24 w-auto object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ) : (
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter text-h3 font-bold text-primary"
                aria-hidden="true"
              >
                {brand.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold text-foreground">
            <Link
              href={`/marcas/${brand.slug}`}
              className="transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
            >
              {brand.name}
            </Link>
          </h3>
          <p className="clamp-2 text-body-sm mt-1 text-muted-foreground">{brandTagline(brand)}</p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="text-caption mb-0">
              {count} {count === 1 ? "producto" : "productos"}
            </span>
            <Link
              href={`/marcas/${brand.slug}`}
              className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Ver productos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}

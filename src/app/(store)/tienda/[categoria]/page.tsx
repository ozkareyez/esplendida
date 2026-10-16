"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, FilterX, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  active: boolean;
  hasVariants: boolean;
}

interface CategoryPageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface BrandOption {
  name: string;
  slug: string;
}

interface CategoryMeta {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

const EMPTY_FILTERS = { marca: "", precioMin: "", precioMax: "", ordenar: "novedad" };
const SORT = [
  { value: "novedad", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
];

const SELECT_BASE =
  "input-elegant cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10";

export default function CategoriaPage({ params, searchParams }: CategoryPageProps) {
  const { categoria } = use(params);
  const resolvedSearchParams = use(searchParams);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<CategoryMeta | null>(null);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    marca: typeof resolvedSearchParams.marca === "string" ? resolvedSearchParams.marca : "",
    ordenar:
      typeof resolvedSearchParams.ordenar === "string"
        ? resolvedSearchParams.ordenar
        : EMPTY_FILTERS.ordenar,
  }));

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (filters.marca) qs.set("marca", filters.marca);
        if (filters.precioMin) qs.set("precioMin", filters.precioMin);
        if (filters.precioMax) qs.set("precioMax", filters.precioMax);
        qs.set("ordenar", filters.ordenar);

        const res = await fetch(`/api/tienda/${categoria}?${qs}`);
        if (!res.ok) {
          throw new Error(`La tienda respondió con estado ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          setCategory(data.category ?? null);
          setBrands(Array.isArray(data.brands) ? data.brands : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setProducts([]);
          setError("No pudimos cargar los productos. Intenta de nuevo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [categoria, filters]);

  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      variantId: null,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] || "",
      brand: product.brand.name,
    });
  };

  const activeFilterCount =
    [filters.marca, filters.precioMin, filters.precioMax].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0 || filters.ordenar !== EMPTY_FILTERS.ordenar;

  const categoryName = category?.name ?? categoria;

  const legendClass = "mb-3 block text-caption text-muted-foreground";

  return (
    <div className="container mx-auto px-4 py-10 lg:px-6 lg:py-14">
      <div className="mb-8 animate-fade-in lg:mb-10">
        <nav className="mb-4 text-body-sm text-muted-foreground" aria-label="Migas de pan">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true" className="text-primary">
              /
            </li>
            <li>
              <Link href="/tienda" className="transition-colors hover:text-primary">
                Tienda
              </Link>
            </li>
            <li aria-hidden="true" className="text-primary">
              /
            </li>
            <li className="font-medium text-foreground">
              {categoryName}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-h1">
              {categoryName}
            </h1>
            <p className="text-body mt-2 text-muted-foreground">
              {products.length} {products.length === 1 ? "producto" : "productos"}
              {hasFilters ? " encontrados" : " disponibles"}
            </p>
          </div>

          <Button
            variant="outline"
            className="h-11 w-full justify-between px-4 sm:w-auto lg:hidden"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-expanded={showFilters}
            aria-controls="filtros-categoria"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filtros */}
        <aside
          id="filtros-categoria"
          className={cn("shrink-0 lg:block lg:w-64", showFilters ? "block" : "hidden")}
        >
          <div className="space-y-6 lg:sticky lg:top-24 animate-fade-in stagger-1">
            <div className="flex items-center justify-between">
              <h2 className="text-h3">Filtros</h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  className="h-9 px-2 text-body-sm"
                  onClick={() => setFilters({ ...EMPTY_FILTERS })}
                >
                  <FilterX className="h-4 w-4" aria-hidden="true" />
                  Limpiar
                </Button>
              )}
            </div>

            <fieldset>
              <legend className={legendClass}>Marca</legend>
              <select
                value={filters.marca}
                onChange={(e) => setFilters({ ...filters, marca: e.target.value })}
                className={SELECT_BASE}
              >
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset>
              <legend className={legendClass}>Rango de precio</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="precio-min" className="sr-only">
                    Precio mínimo
                  </label>
                  <input
                    id="precio-min"
                    type="number"
                    inputMode="numeric"
                    value={filters.precioMin}
                    onChange={(e) => setFilters({ ...filters, precioMin: e.target.value })}
                    placeholder="Mín"
                    className="input-elegant"
                    min={0}
                  />
                </div>
                <div>
                  <label htmlFor="precio-max" className="sr-only">
                    Precio máximo
                  </label>
                  <input
                    id="precio-max"
                    type="number"
                    inputMode="numeric"
                    value={filters.precioMax}
                    onChange={(e) => setFilters({ ...filters, precioMax: e.target.value })}
                    placeholder="Máx"
                    className="input-elegant"
                    min={0}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="lg:hidden">
              <legend className={legendClass}>Ordenar por</legend>
              <select
                value={filters.ordenar}
                onChange={(e) => setFilters({ ...filters, ordenar: e.target.value })}
                className={SELECT_BASE}
              >
                {SORT.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>
        </aside>

        {/* Retícula */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4 xl:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                  aria-hidden="true"
                >
                  <div className="skeleton aspect-square rounded-none" />
                  <div className="space-y-3 p-4">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-4/5" />
                    <div className="skeleton h-5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center animate-fade-in" role="alert">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShoppingCart className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <h2 className="text-h3">No pudimos cargar los productos</h2>
              <p className="text-body mx-auto mt-2 mb-6 max-w-sm text-muted-foreground">
                Ocurrió un problema al consultar la tienda. Vuelve a intentarlo en un momento.
              </p>
              <Button
                className="h-11 px-6"
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
              >
                Reintentar
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center animate-fade-in">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="text-h3">No hay productos</h2>
              <p className="text-body mx-auto mt-2 mb-6 max-w-sm text-muted-foreground">
                {hasFilters
                  ? "Prueba a ajustar o quitar algunos filtros."
                  : "Esta categoría está vacía por ahora."}
              </p>
              {hasFilters && (
                <Button className="h-11 px-6" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
                  <FilterX className="h-4 w-4" aria-hidden="true" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 hidden items-center justify-between lg:flex">
                <p className="text-body-sm text-muted-foreground">
                  {products.length} {products.length === 1 ? "producto" : "productos"}
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="orden-desktop" className="text-body-sm text-muted-foreground">
                    Ordenar
                  </label>
                  <select
                    id="orden-desktop"
                    value={filters.ordenar}
                    onChange={(e) => setFilters({ ...filters, ordenar: e.target.value })}
                    className={cn(SELECT_BASE, "w-56 py-2.5")}
                  >
                    {SORT.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DESIGN.md §26 — 2 móvil · 3 tablet · 4 desktop */}
              <ul className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4 xl:gap-6">
                {products.map((product, index) => (
                  <li
                    key={product.id}
                    className="group animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 0.04, 0.28)}s` }}
                  >
                    <article className="card-elevated flex h-full flex-col">
                      <Link
                        href={`/producto/${product.slug}`}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        aria-label={product.name}
                      >
                        <div className="img-zoom-container relative aspect-square bg-muted">
                          {product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ShoppingCart className="h-10 w-10" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <p className="text-caption mb-1.5 truncate text-muted-foreground">
                          {product.brand.name}
                        </p>
                        <h3 className="clamp-2 text-body-sm font-semibold leading-snug">
                          <Link
                            href={`/producto/${product.slug}`}
                            className="transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                          >
                            {product.name}
                          </Link>
                        </h3>

                        <div className="mt-auto flex flex-col gap-3 pt-3">
                          <span className="text-price text-primary">
                            ${product.price.toLocaleString("es-CO")}
                          </span>
                          {product.hasVariants ? (
                            <Link
                              href={`/producto/${product.slug}`}
                              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-background text-body-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              aria-label={`Elegir opciones de ${product.name}`}
                            >
                              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                              Elegir opciones
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleAddToCart(product)}
                              className="h-10 w-full gap-1.5 border-primary/30 text-body-sm font-semibold text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground"
                              aria-label={`Agregar ${product.name} al carrito`}
                            >
                              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                              Agregar
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Boxes,
  Download,
  History,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/admin-page";
import { cn, formatCurrency } from "@/lib/utils";

interface Variant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    brand: { name: string };
    category: { name: string };
  };
}

type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE";
type TypeFilter = MovementType | "TODOS";

interface Movement {
  id: string;
  type: MovementType;
  quantity: number;
  stockAfter: number;
  motivo: string | null;
  orderId: string | null;
  createdAt: string;
  variant: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    price: number;
    product: {
      name: string;
      slug: string;
      brand: { name: string };
      category: { name: string };
    };
  };
}

const TYPE_LABELS: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

const TYPE_TONES: Record<MovementType, "success" | "destructive" | "info"> = {
  ENTRADA: "success",
  SALIDA: "destructive",
  AJUSTE: "info",
};

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "ENTRADA", label: "Entradas" },
  { key: "SALIDA", label: "Salidas" },
  { key: "AJUSTE", label: "Ajustes" },
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminInventarioPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockQuery, setStockQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("TODOS");
  const [movQuery, setMovQuery] = useState("");
  const [debouncedMovQuery, setDebouncedMovQuery] = useState("");
  const [focusVariantId, setFocusVariantId] = useState<string | null>(null);

  const movSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMovQuery(movQuery), 350);
    return () => clearTimeout(t);
  }, [movQuery]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/inventario");
        if (!res.ok) throw new Error("No se pudo cargar el inventario");
        if (alive) setVariants(await res.json());
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Error al cargar el inventario");
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const loadMovements = useCallback(async () => {
    setMovLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (typeFilter !== "TODOS") params.set("type", typeFilter);
      if (debouncedMovQuery.trim()) params.set("q", debouncedMovQuery.trim());
      if (focusVariantId) params.set("variantId", focusVariantId);

      const res = await fetch(`/api/admin/inventario/movimientos?${params.toString()}`);
      if (!res.ok) throw new Error("No se pudieron cargar los movimientos");
      setMovements(await res.json());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar los movimientos");
    } finally {
      setMovLoading(false);
    }
  }, [typeFilter, debouncedMovQuery, focusVariantId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await loadMovements();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadMovements]);

  const filteredVariants = useMemo(() => {
    const s = stockQuery.trim().toLowerCase();
    if (!s) return variants;
    return variants.filter(
      (v) =>
        v.product.name.toLowerCase().includes(s) ||
        v.name.toLowerCase().includes(s) ||
        (v.barcode ?? "").toLowerCase().includes(s) ||
        v.sku.toLowerCase().includes(s)
    );
  }, [variants, stockQuery]);

  const stats = useMemo(() => {
    const units = variants.reduce((sum, v) => sum + v.stock, 0);
    const value = variants.reduce((sum, v) => sum + v.stock * v.price, 0);
    const low = variants.filter((v) => v.stock <= v.minStock).length;
    return { skus: variants.length, units, value, low };
  }, [variants]);

  const focusVariant = focusVariantId
    ? variants.find((v) => v.id === focusVariantId)
    : undefined;

  const viewVariantMovements = (id: string) => {
    setFocusVariantId(id);
    requestAnimationFrame(() =>
      movSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 w-full rounded-xl" />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        icon={Boxes}
        title="Inventario"
        description="Consulta de stock y de todos los movimientos (entradas, salidas y ajustes)."
        actions={
          <>
            <a
              href="/api/admin/export/inventario"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
            </a>
            <Button variant="outline" size="sm" onClick={() => void loadMovements()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Recargar
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Referencias
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.skus}</p>
          <p className="text-xs text-muted-foreground">SKU en inventario</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unidades
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.units}</p>
          <p className="text-xs text-muted-foreground">En stock total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" aria-hidden="true" /> Valor
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCurrency(stats.value)}
          </p>
          <p className="text-xs text-muted-foreground">Stock × precio</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Stock bajo
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              stats.low > 0 ? "text-destructive" : "text-foreground"
            )}
          >
            {stats.low}
          </p>
          <p className="text-xs text-muted-foreground">En o bajo el mínimo</p>
        </div>
      </div>

      {/* Consulta de stock */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-4 w-4" aria-hidden="true" /> Consulta de stock
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
              placeholder="Buscar por nombre, código de barras..."
              className="h-8 pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredVariants.length === 0 ? (
            <EmptyState
              icon={Search}
              title={stockQuery ? "Sin resultados" : "No hay variantes registradas"}
              description={
                stockQuery
                  ? "No encontramos productos con ese nombre o código."
                  : "Los productos con stock aparecerán aquí."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Producto</th>
                    <th className="py-2 pr-3 font-semibold">Presentación</th>
                    <th className="py-2 pr-3 font-semibold">Código de barras</th>
                    <th className="py-2 pr-3 text-right font-semibold">Precio</th>
                    <th className="py-2 pr-3 text-right font-semibold">Stock</th>
                    <th className="py-2 pr-3 text-right font-semibold">Mín.</th>
                    <th className="py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((v) => {
                    const low = v.stock <= v.minStock;
                    return (
                      <tr key={v.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium text-foreground">{v.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.product.brand.name} · {v.product.category.name}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{v.name}</td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Barcode className="h-3.5 w-3.5" aria-hidden="true" />
                            {v.barcode ?? "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {formatCurrency(v.price)}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <span
                            className={cn(
                              "tabular-nums font-semibold",
                              v.stock <= 0 ? "text-destructive" : low ? "text-amber-600" : "text-foreground"
                            )}
                          >
                            {v.stock}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                          {v.minStock}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => viewVariantMovements(v.id)}
                          >
                            <History className="h-3.5 w-3.5" aria-hidden="true" /> Movimientos
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimientos */}
      <div ref={movSectionRef}>
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" aria-hidden="true" /> Movimientos de inventario
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search
                  className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={movQuery}
                  onChange={(e) => setMovQuery(e.target.value)}
                  placeholder="Nombre, código, SKU..."
                  className="h-8 pl-8"
                />
              </div>
              <a
                href="/api/admin/export/movimientos"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Exportar
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => {
                const active = typeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setTypeFilter(f.key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}

              {focusVariant && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                  Solo: {focusVariant.product.name} · {focusVariant.name}
                  <button
                    type="button"
                    onClick={() => setFocusVariantId(null)}
                    aria-label="Quitar filtro de producto"
                    className="rounded-full px-1 hover:bg-primary/20"
                  >
                    ✕
                  </button>
                </span>
              )}

              {movLoading && (
                <span className="text-xs text-muted-foreground">Actualizando…</span>
              )}
            </div>

            {movements.length === 0 ? (
              <EmptyState
                icon={History}
                title="Sin movimientos"
                description="No hay movimientos que coincidan con el filtro."
              />
            ) : (
              <div className="space-y-2">
                {movements.map((m) => {
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={TYPE_TONES[m.type]} dot>
                              {TYPE_LABELS[m.type]}
                            </StatusBadge>
                            <span className="font-medium text-foreground">
                              {m.variant.product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {m.variant.name}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {m.variant.product.brand.name} · {m.variant.product.category.name}
                            {m.variant.barcode ? ` · Cód. ${m.variant.barcode}` : ""} ·{" "}
                            {m.variant.sku}
                          </div>
                          {m.motivo && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Motivo: {m.motivo}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {fmtDateTime(m.createdAt)}
                            {m.orderId ? ` · Pedido ${m.orderId.slice(0, 8)}` : ""}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div
                            className={cn(
                              "text-lg font-semibold tabular-nums",
                              m.quantity > 0 ? "text-success" : "text-destructive"
                            )}
                          >
                            {m.quantity > 0 ? "+" : ""}
                            {m.quantity}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Stock: <span className="tabular-nums">{m.stockAfter}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Precio:{" "}
                            <span className="tabular-nums">
                              {formatCurrency(m.variant.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {movements.length >= 500 && (
                  <p className="pt-1 text-center text-xs text-muted-foreground">
                    Mostrando los 500 movimientos más recientes. Refina la búsqueda o usa los
                    filtros para ver otros.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}

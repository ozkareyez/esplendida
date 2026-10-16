"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Barcode,
  Boxes,
  Minus,
  PackageX,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/admin-page";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryVariant } from "@/lib/admin-types";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const emptyCreate = {
  productName: "",
  slug: "",
  barcode: "",
  sku: "",
  price: 0,
  stock: 0,
  minStock: 0,
  brandId: "",
  categoryId: "",
};

export default function CRMPage() {
  const showToast = useToast((s) => s.showToast);

  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InventoryVariant[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");

  const [cart, setCart] = useState<{ variant: InventoryVariant; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [form, setForm] = useState(emptyCreate);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, brandRes, catRes] = await Promise.all([
        fetch("/api/admin/inventario"),
        fetch("/api/admin/brands"),
        fetch("/api/admin/categories"),
      ]);
      if (!invRes.ok) throw new Error("No se pudo cargar el inventario");
      if (!brandRes.ok) throw new Error("No se pudieron cargar las marcas");
      if (!catRes.ok) throw new Error("No se pudieron cargar las categorías");
      setVariants(await invRes.json());
      setBrands(await brandRes.json());
      setCategories(await catRes.json());
    } catch (e: unknown) {
      showToast({
        title: "Error al cargar datos",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await fetchAll();
    };
    void run();
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const doSearch = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (!q) {
        setResults(null);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/crm/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo buscar");
        setResults(data as InventoryVariant[]);
      } catch (e: unknown) {
        showToast({
          title: "Error de búsqueda",
          description: e instanceof Error ? e.message : undefined,
          variant: "error",
        });
      } finally {
        setSearching(false);
      }
    },
    [showToast]
  );

  const lowStock = useMemo(
    () => variants.filter((v) => v.stock > 0 && v.minStock > 0 && v.stock <= v.minStock),
    [variants]
  );
  const outStock = useMemo(() => variants.filter((v) => v.stock <= 0), [variants]);

  const slugify = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const createQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.productName,
        slug: form.slug.trim() || slugify(form.productName),
        barcode: form.barcode.trim() || null,
        sku: form.sku.trim() || undefined,
        price: form.price,
        stock: form.stock,
        minStock: form.minStock,
        brandId: form.brandId,
        categoryId: form.categoryId,
      };
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el producto");
      showToast({
        title: "Producto creado",
        description: `${form.productName} · stock ${form.stock}`,
        variant: "success",
      });
      setForm(emptyCreate);
      setResults(null);
      setSearch("");
      await fetchAll();
    } catch (e: unknown) {
      showToast({
        title: "No se pudo crear",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const quickMove = async (
    variant: InventoryVariant,
    type: "ENTRADA" | "SALIDA" | "AJUSTE",
    qty: number
  ) => {
    if (!Number.isFinite(qty) || qty < 0 || (type !== "AJUSTE" && qty === 0)) return;
    try {
      const res = await fetch("/api/admin/inventario/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, type, quantity: qty, motivo: "Ajuste rápido CRM" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo ajustar el stock");
      showToast({
        title: type === "SALIDA" ? "Stock descontado" : "Stock actualizado",
        description: `${variant.product.name} — ${variant.name}`,
        variant: "success",
      });
      setAdjustingId(null);
      setAdjustValue("");
      await fetchAll();
      if (search.trim()) await doSearch(search);
    } catch (e: unknown) {
      showToast({
        title: "Error al ajustar stock",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  };

  const addToCart = (v: InventoryVariant) => {
    if (v.stock <= 0) {
      showToast({ title: "Sin stock disponible", variant: "error" });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.variant.id === v.id);
      if (existing) {
        if (existing.quantity >= v.stock) return prev;
        return prev.map((l) =>
          l.variant.id === v.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { variant: v, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.variant.id !== id) return [l];
        const quantity = l.quantity + delta;
        if (quantity <= 0) return [];
        if (quantity > l.variant.stock) return [l];
        return [{ ...l, quantity }];
      })
    );
  };

  const removeLine = (id: string) =>
    setCart((prev) => prev.filter((l) => l.variant.id !== id));

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.variant.price * l.quantity, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ventas-mostrador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({ variantId: l.variant.id, quantity: l.quantity })),
          customer: { name: customerName, phone: customerPhone },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar la venta");
      showToast({
        title: "Venta registrada",
        description: `Factura ${data.invoice?.numero ?? "—"} · ${formatCurrency(Number(data.total))}`,
        variant: "success",
      });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      await fetchAll();
    } catch (e: unknown) {
      showToast({
        title: "No se pudo cobrar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (v: InventoryVariant) => (
    <div
      key={v.id}
      className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {v.product.name} <span className="text-muted-foreground">— {v.name}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {v.barcode ? `Cód. ${v.barcode} · ` : ""}SKU {v.sku} · ${v.price.toLocaleString("es-CO")} ·{" "}
          Stock {v.stock}
          {v.minStock > 0 ? ` · Mín ${v.minStock}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" onClick={() => addToCart(v)} disabled={v.stock <= 0}>
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /> Agregar
        </Button>
        <Button size="sm" variant="outline" onClick={() => quickMove(v, "ENTRADA", 1)}>
          +1
        </Button>
        <Button size="sm" variant="outline" onClick={() => quickMove(v, "ENTRADA", 10)}>
          +10
        </Button>
        <Button size="sm" variant="outline" onClick={() => quickMove(v, "SALIDA", 1)}>
          -1
        </Button>
        {adjustingId === v.id ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              type="number"
              min={0}
              className="h-7 w-20"
              value={adjustValue}
              onChange={(e) => setAdjustValue(e.target.value)}
              placeholder="Final"
            />
            <Button
              size="sm"
              onClick={() => quickMove(v, "AJUSTE", Number(adjustValue))}
              disabled={adjustValue === ""}
            >
              Fijar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdjustingId(null)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setAdjustingId(v.id); setAdjustValue(""); }}>
            Ajuste
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="CRM · Punto de venta"
        description="Consulta por código de barras, SKU o nombre · ajuste rápido de stock"
        actions={
          <>
            <Link
              href="/admin/inventario"
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Inventario
            </Link>
            <Link
              href="/admin/productos"
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Productos
            </Link>
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              Recargar
            </Button>
          </>
        }
      />

      <Tabs defaultValue="venta">
        <TabsList>
          <TabsTab value="venta">
            <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Punto de venta
          </TabsTab>
          <TabsTab value="ingreso">
            <Plus className="h-4 w-4" aria-hidden="true" /> Ingreso rápido
          </TabsTab>
          <TabsTab value="inventario">
            <Boxes className="h-4 w-4" aria-hidden="true" /> Inventario
          </TabsTab>
        </TabsList>

        <TabsPanel value="venta" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-4 w-4" aria-hidden="true" /> Búsqueda / consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void doSearch(search);
                }}
              >
                <Input
                  autoFocus
                  placeholder="Escanea o escribe: código de barras, SKU o nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit" disabled={searching}>
                  <Search className="h-4 w-4" aria-hidden="true" /> Buscar
                </Button>
              </form>

              {results !== null && (
                <div className="space-y-2">
                  <p className="text-body-sm text-muted-foreground">Resultados ({results.length})</p>
                  {results.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="Sin resultados"
                      description="Usa «Ingreso rápido» para crear el producto con este código."
                      className="py-6"
                    />
                  ) : (
                    results.map(renderRow)
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Venta en tienda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="Sin productos"
                  description="Busca y pulsa «Agregar»."
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {cart.map((line) => (
                    <div
                      key={line.variant.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {line.variant.product.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {line.variant.name} · {formatCurrency(line.variant.price)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => changeQty(line.variant.id, -1)}
                          aria-label="Quitar uno"
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => changeQty(line.variant.id, 1)}
                          disabled={line.quantity >= line.variant.stock}
                          aria-label="Agregar uno"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => removeLine(line.variant.id)}
                          aria-label="Quitar producto"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Cliente (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  placeholder="Teléfono (opcional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Procesando..." : "Cobrar"}
              </Button>
            </CardContent>
          </Card>
        </TabsPanel>

        <TabsPanel value="ingreso" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" /> Ingreso rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createQuick} className="space-y-2">
                <Input
                  placeholder="Nombre del producto *"
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Código de barras"
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  />
                  <Input
                    placeholder="SKU (opcional)"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Precio *"
                    value={form.price || ""}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                    required
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Stock"
                    value={form.stock || ""}
                    onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Stock mín."
                    value={form.minStock || ""}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.brandId}
                    onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                    required
                  >
                    <option value="">Marca *</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    required
                  >
                    <option value="">Categoría *</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Creando..." : "Crear producto + variante"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsPanel>

        <TabsPanel value="inventario" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-amber-600" aria-hidden="true" /> Bajo stock (
                  {lowStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : lowStock.length === 0 ? (
                  <EmptyState title="Sin alertas" description="Todo el inventario está por encima del mínimo." className="py-6" />
                ) : (
                  lowStock.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {v.product.name} — {v.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.barcode || "sin código"} · SKU {v.sku}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {v.stock} / {v.minStock}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => quickMove(v, "ENTRADA", 10)}>
                          +10
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-destructive" aria-hidden="true" /> Agotados (
                  {outStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : outStock.length === 0 ? (
                  <EmptyState title="Todo con stock" className="py-6" />
                ) : (
                  outStock.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {v.product.name} — {v.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.barcode || "sin código"} · SKU {v.sku}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => quickMove(v, "ENTRADA", 10)}>
                        +10
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventario completo ({variants.length})</CardTitle>
              <Link
                href="/admin/inventario"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
              >
                Gestionar
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Producto</th>
                      <th className="py-2 pr-4">Variante</th>
                      <th className="py-2 pr-4">Código barras</th>
                      <th className="py-2 pr-4 text-right">Precio</th>
                      <th className="py-2 pr-4 text-right">Stock</th>
                      <th className="py-2 pr-4">Marca · Categoría</th>
                      <th className="py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.slice(0, 100).map((v) => (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{v.product.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{v.name}</td>
                        <td className="py-2 pr-4">{v.barcode || "—"}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          ${v.price.toLocaleString("es-CO")}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-4 text-right font-semibold tabular-nums",
                            v.stock <= 0
                              ? "text-destructive"
                              : v.minStock > 0 && v.stock <= v.minStock
                                ? "text-amber-600"
                                : "text-foreground"
                          )}
                        >
                          {v.stock}
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                          {v.product.brand?.name ?? "—"} · {v.product.category?.name ?? "—"}
                        </td>
                        <td className="flex gap-1 py-2">
                          <Button size="xs" variant="outline" onClick={() => quickMove(v, "ENTRADA", 1)}>
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => quickMove(v, "SALIDA", 1)}>
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {variants.length > 100 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mostrando primeras 100 filas. Usa la búsqueda para localizar productos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsPanel>
      </Tabs>
    </AdminPageContainer>
  );
}

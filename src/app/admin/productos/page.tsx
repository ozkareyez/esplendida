"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Barcode,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/admin-page";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { cn, formatCurrency, slugify } from "@/lib/utils";

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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  active: boolean;
  featured: boolean;
  brandId: string;
  categoryId: string;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  sku?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
}

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  imagesText: "",
  active: true,
  featured: false,
  brandId: "",
  categoryId: "",
  barcode: "",
  stock: 0,
  minStock: 0,
};

function Cell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/30 px-3 py-2", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 truncate text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function AdminProductosPage() {
  const showToast = useToast((s) => s.showToast);
  const confirm = useConfirm((s) => s.confirm);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch("/api/admin/productos"),
        fetch("/api/admin/brands"),
        fetch("/api/admin/categories"),
      ]);
      if (!pRes.ok) throw new Error("No se pudieron cargar productos");
      if (!bRes.ok) throw new Error("No se pudieron cargar marcas");
      if (!cRes.ok) throw new Error("No se pudieron cargar categorías");
      setProducts(await pRes.json());
      setBrands(await bRes.json());
      setCategories(await cRes.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await fetchData();
    };
    void run();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const derivedSlug = useMemo(() => slugify(form.name), [form.name]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const parseImages = (text: string) =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      imagesText: p.images.join(", "),
      active: p.active,
      featured: p.featured,
      brandId: p.brandId,
      categoryId: p.categoryId,
      barcode: p.barcode ?? "",
      stock: p.stock ?? 0,
      minStock: p.minStock ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of images) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/cloudinary", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploaded.push(data.url);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (uploaded.length > 0) {
      const current = parseImages(form.imagesText);
      setForm((f) => ({ ...f, imagesText: [...current, ...uploaded].join(", ") }));
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: derivedSlug,
      description: form.description,
      price: Number(form.price),
      images: parseImages(form.imagesText),
      active: Boolean(form.active),
      featured: Boolean(form.featured),
      brandId: form.brandId,
      categoryId: form.categoryId,
      barcode: form.barcode,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/productos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "No se pudo actualizar");
        }
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast({ title: "Producto actualizado", variant: "success" });
        resetForm();
      } else {
        const res = await fetch("/api/admin/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "No se pudo crear");
        }
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
        showToast({
          title: "Producto creado",
          description: form.name,
          variant: "success",
        });
        resetForm();
      }
    } catch (e: unknown) {
      showToast({
        title: "Error al guardar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "¿Eliminar este producto?",
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/productos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar");
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast({ title: "Producto eliminado", variant: "success" });
    } catch (e: unknown) {
      showToast({
        title: "Error al eliminar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      const res = await fetch(`/api/admin/productos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "No se pudo actualizar");
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast({
        title: updated.active ? "Producto activado" : "Producto desactivado",
        variant: "success",
      });
    } catch (e: unknown) {
      showToast({
        title: "Error al cambiar estado",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  };

  const brandName = brands.find((b) => b.id === form.brandId)?.name ?? "—";
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? "—";
  const previewImages = parseImages(form.imagesText);

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Panel de Productos"
        description="Registra el producto y su inventario inicial en un solo lugar."
        actions={
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Recargar
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil className="h-4 w-4 text-primary" aria-hidden="true" /> Editar producto
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-primary" aria-hidden="true" /> Nuevo producto
              </>
            )}
          </CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Cancelar edición
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Fila horizontal de campos */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nombre del producto *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Labial mate rojo"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Código de barras
                </label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Escanea o escribe"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Precio (COP) *
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price === 0 && !editingId ? "" : form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value === "" ? 0 : Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Marca *</label>
                <select
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  required
                >
                  <option value="">Selecciona una marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Categoría *
                </label>
                <select
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Stock inicial
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))}
                  placeholder="0"
                />
                {editingId && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ajusta el stock desde Inventario.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Stock mínimo
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Imagen + descripción */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Imagen del producto
                </label>
                <div
                  className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background px-3 py-4 text-center transition-colors hover:border-primary/50"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    void uploadFiles(Array.from(e.dataTransfer.files));
                  }}
                >
                  {previewImages[0] ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={previewImages[0]}
                        alt="Vista previa"
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    id="image-upload"
                    onChange={(e) => {
                      void uploadFiles(Array.from(e.target.files || []));
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-2 cursor-pointer text-xs font-medium text-primary hover:underline"
                  >
                    {uploading ? "Subiendo..." : "Arrastra una imagen o haz clic para subir"}
                  </label>
                  <Input
                    className="mt-2 h-8 text-xs"
                    value={form.imagesText}
                    onChange={(e) => setForm((f) => ({ ...f, imagesText: e.target.value }))}
                    placeholder="…o pega URLs separadas por coma"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Descripción
                </label>
                <textarea
                  className="flex min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalles, materiales, tonos, etc."
                />
              </div>
            </div>

            {/* Resumen en cuadrículas */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resumen del producto
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <Cell label="Nombre">{form.name || "—"}</Cell>
                <Cell label="Slug (automático)">
                  <span className="text-muted-foreground">/{derivedSlug || "—"}</span>
                </Cell>
                <Cell label="Código de barras">
                  <span className="inline-flex items-center gap-1">
                    <Barcode className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {form.barcode || "—"}
                  </span>
                </Cell>
                <Cell label="Precio">{form.price ? formatCurrency(form.price) : "—"}</Cell>
                <Cell label="Marca">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {brandName}
                  </span>
                </Cell>
                <Cell label="Categoría">{categoryName}</Cell>
                <Cell label="Stock inicial">{form.stock}</Cell>
                <Cell label="Stock mínimo">{form.minStock}</Cell>
                <Cell label="Estado">
                  <StatusBadge tone={form.active ? "success" : "neutral"}>
                    {form.active ? "Activo" : "Inactivo"}
                  </StatusBadge>
                </Cell>
                <Cell label="Destacado">
                  {form.featured ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> Sí
                    </span>
                  ) : (
                    "No"
                  )}
                </Cell>
                <Cell label="Imágenes">{previewImages.length}</Cell>
                <Cell label="Descripción" className="sm:col-span-2 lg:col-span-1">
                  {form.description ? "Sí" : "—"}
                </Cell>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm">
                  Activo
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                />
                <label htmlFor="featured" className="text-sm">
                  Destacado (aparece en el home)
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" aria-hidden="true" /> Productos ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No hay productos todavía"
              description="Registra el primero con el formulario de arriba."
            />
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{p.name}</span>
                        <StatusBadge tone={p.active ? "success" : "neutral"}>
                          {p.active ? "Activo" : "Inactivo"}
                        </StatusBadge>
                        {p.featured && (
                          <Star
                            className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.brand.name} · {p.category.name} · {formatCurrency(p.price)}
                        {p.barcode ? ` · ${p.barcode}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Stock:{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            (p.stock ?? 0) <= 0 ? "text-destructive" : "text-foreground"
                          )}
                        >
                          {p.stock ?? 0}
                        </span>
                        {p.minStock ? ` · Mín: ${p.minStock}` : ""} · /{p.slug}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                      {p.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

export default function AdminMarcasPage() {
  const showToast = useToast((s) => s.showToast);
  const confirm = useConfirm((s) => s.confirm);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logoUrl: "", description: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) throw new Error("No se pudieron cargar las marcas");
      setBrands(await res.json());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al cargar datos";
      setError(message);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", logoUrl: "", description: "" });
  };

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setForm({ name: b.name, slug: b.slug, logoUrl: b.logoUrl || "", description: b.description || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      logoUrl: form.logoUrl || null,
      description: form.description || null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/brands/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "No se pudo actualizar");
        }
        const updated = await res.json();
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast({ title: "Marca actualizada", variant: "success" });
        resetForm();
      } else {
        const res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "No se pudo crear");
        }
        const created = await res.json();
        setBrands((prev) => [created, ...prev]);
        showToast({ title: "Marca creada", variant: "success" });
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
      title: "¿Eliminar esta marca?",
      description: "Los productos asociados podrían quedar sin marca.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar");
      }
      setBrands((prev) => prev.filter((b) => b.id !== id));
      showToast({ title: "Marca eliminada", variant: "success" });
    } catch (e: unknown) {
      showToast({
        title: "Error al eliminar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel de Marcas</h1>
          <p className="text-sm text-muted-foreground">Gestiona las marcas de los productos</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          Recargar
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar marca" : "Nueva marca"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Logo URL (opcional)</label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/.../image/upload/esplendor/brands/mi-logo"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reseña (opcional)</label>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Especialistas en maquillaje de larga duración…"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Texto corto que aparece en la página de marcas.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
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
            <CardTitle>Marcas ({brands.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              {brands.map((b) => (
                <div key={b.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.slug}</div>
                    {b.description && (
                      <div className="mt-1 max-w-[280px] text-xs text-muted-foreground">
                        {b.description}
                      </div>
                    )}
                    {b.logoUrl && (
                      <div className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">{b.logoUrl}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => startEdit(b)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

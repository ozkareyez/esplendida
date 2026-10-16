"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  Package,
  Plus,
  Printer,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/admin-page";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { cn, formatCurrency } from "@/lib/utils";

type OrderStatus = "NUEVO" | "CONFIRMADO" | "PAGADO" | "ENTREGADO" | "CANCELADO";
type Canal = "WHATSAPP" | "WEB" | "MOSTRADOR";
type Entrega = "DOMICILIO" | "TIENDA";

interface OrderRow {
  id: string;
  status: OrderStatus;
  canal: Canal;
  entregaMetodo: Entrega;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string; city: string | null };
  invoice: { id: string; numero: string; status: string } | null;
  itemCount: number;
}

interface OrderDetail extends Omit<OrderRow, "invoice"> {
  notas: string | null;
  invoice: {
    id: string;
    numero: string;
    status: string;
    total: number;
    impuestos: number;
  } | null;
  items: {
    id: string;
    quantity: number;
    priceUnitario: number;
    variant: { id: string; name: string; sku: string };
    product: { id: string; name: string; slug: string };
  }[];
  movements: {
    id: string;
    type: string;
    quantity: number;
    stockAfter: number;
    variant: { id: string; name: string; sku: string };
  }[];
}

interface VariantOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  product: { id: string; name: string };
}

const STATUS_TONES: Record<OrderStatus, StatusTone> = {
  NUEVO: "info",
  CONFIRMADO: "warning",
  PAGADO: "success",
  ENTREGADO: "success",
  CANCELADO: "destructive",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  NUEVO: "Nuevo",
  CONFIRMADO: "Confirmado",
  PAGADO: "Pagado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const CANAL_LABEL: Record<Canal, string> = {
  WHATSAPP: "WhatsApp",
  WEB: "Web",
  MOSTRADOR: "Mostrador",
};

const STATUS_FILTERS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "NUEVO", label: "Nuevos" },
  { value: "CONFIRMADO", label: "Confirmados" },
  { value: "PAGADO", label: "Pagados" },
  { value: "ENTREGADO", label: "Entregados" },
  { value: "CANCELADO", label: "Cancelados" },
];

const NEXT_ACTIONS: Record<OrderStatus, { to: OrderStatus; label: string }[]> = {
  NUEVO: [
    { to: "CONFIRMADO", label: "Confirmar" },
    { to: "CANCELADO", label: "Cancelar" },
  ],
  CONFIRMADO: [
    { to: "PAGADO", label: "Marcar pagado" },
    { to: "CANCELADO", label: "Cancelar" },
  ],
  PAGADO: [
    { to: "ENTREGADO", label: "Entregar" },
    { to: "CANCELADO", label: "Cancelar" },
  ],
  ENTREGADO: [],
  CANCELADO: [],
};

const TRANSITION_COPY: Partial<Record<OrderStatus, { title: string; description: string }>> = {
  CONFIRMADO: {
    title: "¿Confirmar este pedido?",
    description: "Se descontará el stock de las variantes del pedido.",
  },
  PAGADO: {
    title: "¿Marcar como pagado?",
    description: "La factura asociada pasará a estado PAGADA.",
  },
  ENTREGADO: {
    title: "¿Marcar como entregado?",
    description: "El pedido se cerrará como entregado al cliente.",
  },
  CANCELADO: {
    title: "¿Cancelar este pedido?",
    description: "Se devolverá el stock reservado y no podrá revertirse fácilmente.",
  },
};

const EMPTY_ITEM = { variantId: "", quantity: 1 };

export default function AdminPedidosPage() {
  const showToast = useToast((s) => s.showToast);
  const confirm = useConfirm((s) => s.confirm);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    canal: "WHATSAPP" as Canal,
    entregaMetodo: "DOMICILIO" as Entrega,
    notas: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const [filterCanal, setFilterCanal] = useState<Canal | "">("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCanal) params.set("canal", filterCanal);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const qs = params.toString();
      const res = await fetch(`/api/admin/pedidos${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("No se pudieron cargar los pedidos");
      setOrders(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCanal, desde, hasta]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await fetchOrders();
    };
    void run();
    return () => {
      active = false;
    };
  }, [fetchOrders]);

  const loadVariants = useCallback(async () => {
    if (variantsLoaded) return;
    try {
      const res = await fetch("/api/admin/inventario");
      if (!res.ok) throw new Error("No se pudieron cargar las variantes");
      setVariants(await res.json());
      setVariantsLoaded(true);
    } catch (e: unknown) {
      showToast({
        title: "Error al cargar productos",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }, [variantsLoaded, showToast]);

  const openCreate = () => {
    setCreateOpen(true);
    void loadVariants();
  };

  const hasActiveFilters = Boolean(filterStatus || filterCanal || desde || hasta);

  const clearFilters = () => {
    setFilterStatus("");
    setFilterCanal("");
    setDesde("");
    setHasta("");
  };

  const openDetail = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(id);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`);
      if (res.ok) setDetail(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      city: "",
      address: "",
      canal: "WHATSAPP",
      entregaMetodo: "DOMICILIO",
      notas: "",
    });
    setItems([{ ...EMPTY_ITEM }]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: form.canal,
          entregaMetodo: form.entregaMetodo,
          notas: form.notas,
          customer: {
            name: form.name,
            phone: form.phone,
            city: form.city,
            address: form.address,
          },
          items: items.filter((i) => i.variantId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el pedido");
      showToast({ title: "Pedido creado", description: form.name, variant: "success" });
      resetForm();
      setCreateOpen(false);
      await fetchOrders();
    } catch (e: unknown) {
      showToast({
        title: "Error al crear el pedido",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: OrderStatus) => {
    const copy = TRANSITION_COPY[status];
    if (copy) {
      const ok = await confirm({
        title: copy.title,
        description: copy.description,
        confirmLabel: status === "CANCELADO" ? "Cancelar pedido" : "Continuar",
        destructive: status === "CANCELADO",
      });
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      showToast({ title: `Pedido ${STATUS_LABEL[status].toLowerCase()}`, variant: "success" });
      await fetchOrders();
      if (expanded === id) openDetail(id);
    } catch (e: unknown) {
      showToast({
        title: "Error al cambiar estado",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = (invoiceId: string, numero: string) => {
    window.open(
      `/api/admin/facturas/${invoiceId}/print`,
      `factura-${numero}`,
      "width=420,height=720"
    );
  };

  const itemTotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const v = variants.find((x) => x.id === it.variantId);
        return sum + (v ? v.price * it.quantity : 0);
      }, 0),
    [items, variants]
  );

  if (loading && orders.length === 0 && !hasActiveFilters) {
    return (
      <AdminPageContainer>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Pedidos"
        description={`${orders.length} pedido${orders.length === 1 ? "" : "s"} en esta vista`}
        actions={
          <>
            <a
              href="/api/admin/export/ventas"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
            </a>
            <Button variant="outline" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />{" "}
              Recargar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo pedido
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilterStatus(f.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filterStatus === f.value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Canal
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                value={filterCanal}
                onChange={(e) => setFilterCanal(e.target.value as Canal | "")}
              >
                <option value="">Todos</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEB">Web</option>
                <option value="MOSTRADOR">Mostrador</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Desde
              <Input
                type="date"
                className="h-8 w-auto text-sm"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Hasta
              <Input
                type="date"
                className="h-8 w-auto text-sm"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </label>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Listado de pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title={hasActiveFilters ? "Sin pedidos con estos filtros" : "No hay pedidos todavía"}
              description={
                hasActiveFilters
                  ? "Prueba ajustando el estado, canal o rango de fechas."
                  : "Crea el primer pedido desde el botón «Nuevo pedido»."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo pedido
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium">{o.customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.customer.phone}
                        {o.customer.city ? ` · ${o.customer.city}` : ""} · {o.itemCount} ítem(s)
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={STATUS_TONES[o.status]}>
                          {STATUS_LABEL[o.status]}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {CANAL_LABEL[o.canal]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold">{formatCurrency(o.total)}</div>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        {o.invoice && (
                          <Button
                            size="icon-xs"
                            variant="outline"
                            aria-label={`Imprimir factura ${o.invoice.numero}`}
                            title={`Imprimir ${o.invoice.numero}`}
                            onClick={() => printInvoice(o.invoice!.id, o.invoice!.numero)}
                          >
                            <Printer className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDetail(o.id)}
                          className="inline-flex items-center text-xs text-primary"
                        >
                          Detalle
                          <ChevronDown
                            className={cn(
                              "ml-1 h-3.5 w-3.5 transition-transform",
                              expanded === o.id && "rotate-180"
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {NEXT_ACTIONS[o.status].length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {NEXT_ACTIONS[o.status].map((action) => (
                        <Button
                          key={action.to}
                          size="sm"
                          variant={action.to === "CANCELADO" ? "destructive" : "outline"}
                          disabled={saving}
                          onClick={() => changeStatus(o.id, action.to)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {expanded === o.id && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
                      {!detail ? (
                        <p className="text-muted-foreground">Cargando detalle...</p>
                      ) : (
                        <>
                          <ul className="space-y-1">
                            {detail.items.map((it) => (
                              <li key={it.id} className="flex justify-between">
                                <span>
                                  {it.quantity}× {it.product.name} — {it.variant.name}
                                </span>
                                <span>{formatCurrency(it.priceUnitario * it.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          {detail.invoice && (
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                Factura {detail.invoice.numero} · IVA{" "}
                                {formatCurrency(detail.invoice.impuestos)}
                              </span>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  printInvoice(detail.invoice!.id, detail.invoice!.numero)
                                }
                              >
                                <Printer className="h-3 w-3" aria-hidden="true" /> Imprimir
                              </Button>
                            </div>
                          )}
                          {detail.movements.length > 0 && (
                            <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                              Movimientos de inventario:{" "}
                              {detail.movements
                                .map(
                                  (m) =>
                                    `${m.variant.name} ${m.quantity > 0 ? "+" : ""}${m.quantity}`
                                )
                                .join(", ")}
                            </div>
                          )}
                          {detail.notas && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Nota: {detail.notas}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>
              Registra un pedido manual (WhatsApp, web o mostrador).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Teléfono</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ciudad</label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Dirección</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Canal</label>
                <select
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={form.canal}
                  onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value as Canal }))}
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="WEB">Web</option>
                  <option value="MOSTRADOR">Mostrador</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Entrega</label>
                <select
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={form.entregaMetodo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, entregaMetodo: e.target.value as Entrega }))
                  }
                >
                  <option value="DOMICILIO">Domicilio</option>
                  <option value="TIENDA">Recoger en tienda</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Productos</label>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                      value={it.variantId}
                      onChange={(e) =>
                        setItems((arr) =>
                          arr.map((x, i) =>
                            i === idx ? { ...x, variantId: e.target.value } : x
                          )
                        )
                      }
                    >
                      <option value="">
                        {variantsLoaded ? "Selecciona producto" : "Cargando productos..."}
                      </option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.stock === 0}>
                          {v.product.name} — {v.name} ({formatCurrency(v.price)}) · {v.stock} disp.
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-20"
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((arr) =>
                          arr.map((x, i) =>
                            i === idx ? { ...x, quantity: Number(e.target.value) } : x
                          )
                        )
                      }
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                        aria-label="Quitar línea"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setItems((arr) => [...arr, { ...EMPTY_ITEM }])}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar línea
              </Button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notas</label>
              <Input
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </div>

            <DialogFooter className="items-center">
              <div className="mr-auto text-sm text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(itemTotal)}
                </span>
              </div>
              <Button type="submit" disabled={saving || itemTotal === 0}>
                {saving ? "Creando..." : "Crear pedido"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageContainer>
  );
}

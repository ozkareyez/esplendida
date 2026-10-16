"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/admin-page";

type InvoiceStatus = "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA";

interface InvoiceRow {
  id: string;
  numero: string;
  status: InvoiceStatus;
  total: number;
  impuestos: number;
  fecha: string;
  orderId: string;
  canal: "WHATSAPP" | "WEB";
  customer: { name: string; phone: string };
}

const STATUS_TONES: Record<InvoiceStatus, StatusTone> = {
  PENDIENTE: "neutral",
  EMITIDA: "warning",
  PAGADA: "success",
  ANULADA: "destructive",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "EMITIDA", label: "Emitidas" },
  { value: "PAGADA", label: "Pagadas" },
  { value: "ANULADA", label: "Anuladas" },
];

export default function AdminFacturasPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [totals, setTotals] = useState({ total: 0, impuestos: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const qs = params.toString();
      const res = await fetch(`/api/admin/facturas${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("No se pudieron cargar las facturas");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotals(data.totals || { total: 0, impuestos: 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [filter, desde, hasta]);

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

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Facturas"
        description="IVA 19% incluido en el precio. Total y base se desglosan por factura."
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Facturado (no anulado)</p>
            <p className="text-2xl font-semibold">${totals.total.toLocaleString("es-CO")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">IVA recaudado</p>
            <p className="text-2xl font-semibold">${totals.impuestos.toLocaleString("es-CO")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Base gravable</p>
            <p className="text-2xl font-semibold">
              ${(totals.total - totals.impuestos).toLocaleString("es-CO")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as string)}
        >
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTab key={f.value} value={f.value}>
                {f.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>

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
        {(desde || hasta) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar fechas
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" aria-hidden="true" /> {invoices.length} facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No hay facturas para este filtro"
              description="Prueba con otro estado o registra una nueva venta."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Número</th>
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Canal</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4 text-right">Base</th>
                    <th className="py-2 pr-4 text-right">IVA</th>
                    <th className="py-2 pr-4 text-right">Total</th>
                    <th className="py-2 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{inv.numero}</td>
                      <td className="py-2 pr-4">
                        {inv.customer.name}
                        <span className="block text-xs text-muted-foreground">
                          {inv.customer.phone}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{inv.canal}</td>
                      <td className="py-2 pr-4">
                        <StatusBadge tone={STATUS_TONES[inv.status]}>{inv.status}</StatusBadge>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        ${(inv.total - inv.impuestos).toLocaleString("es-CO")}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        ${inv.impuestos.toLocaleString("es-CO")}
                      </td>
                      <td className="py-2 pr-4 text-right font-semibold tabular-nums">
                        ${inv.total.toLocaleString("es-CO")}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/api/admin/facturas/${inv.id}/print`,
                                "impresion-termica",
                                "width=420,height=720"
                              )
                            }
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted"
                          >
                            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                            Imprimir
                          </button>
                        </div>
                        {new Date(inv.fecha).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}

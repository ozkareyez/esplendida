"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  PackageX,
  Receipt,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardStats, StockAlertItem } from "@/lib/admin-types";

const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  CONFIRMADO: "Confirmado",
  PAGADO: "Pagado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  NUEVO: "bg-primary/10 text-primary",
  CONFIRMADO: "bg-amber-500/10 text-amber-600",
  PAGADO: "bg-success/10 text-success",
  ENTREGADO: "bg-success/10 text-success",
  CANCELADO: "bg-destructive/10 text-destructive",
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Receipt;
  tone: "primary" | "success" | "warning" | "destructive";
}

function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="py-5">
      <CardContent className="flex items-center gap-4 px-5">
        <span
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            styles
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ item }: { item: StockAlertItem }) {
  const out = item.stock <= 0;
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.product}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.variant}
          {item.barcode ? ` · ${item.barcode}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
          out ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
        )}
      >
        {out ? "Agotado" : `${item.stock} / ${item.minStock}`}
      </span>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-5">
            <CardContent className="flex items-center gap-4 px-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertTab, setAlertTab] = useState<"low" | "out">("low");

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el dashboard");
      setStats(data as DashboardStats);
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

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error ?? "No se pudo cargar el dashboard"}
        </div>
        <Button className="mt-4" variant="outline" onClick={fetchData}>
          Reintentar
        </Button>
      </div>
    );
  }

  const alertCount = stats.inventory.lowStock + stats.inventory.outOfStock;
  const activeAlerts = alertTab === "low" ? stats.alerts.lowStock : stats.alerts.outOfStock;
  const statusEntries = Object.entries(stats.orders.byStatus).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-body-sm text-muted-foreground">Resumen operativo de la tienda</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          Recargar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={formatCurrency(stats.sales.today)}
          icon={ShoppingBag}
          tone="success"
          hint="Pedidos no cancelados"
        />
        <StatCard
          label="Ventas del mes"
          value={formatCurrency(stats.sales.month)}
          icon={Receipt}
          tone="primary"
        />
        <StatCard
          label="Pedidos abiertos"
          value={formatNumber(stats.orders.open)}
          icon={ArrowUpRight}
          tone="warning"
          hint={`${formatNumber(stats.orders.total)} en total`}
        />
        <StatCard
          label="Alertas de stock"
          value={formatNumber(alertCount)}
          icon={TriangleAlert}
          tone="destructive"
          hint={`${stats.inventory.outOfStock} agotados · ${stats.inventory.lowStock} bajos`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Alertas de inventario</CardTitle>
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setAlertTab("low")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  alertTab === "low"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bajos ({stats.inventory.lowStock})
              </button>
              <button
                type="button"
                onClick={() => setAlertTab("out")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  alertTab === "out"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Agotados ({stats.inventory.outOfStock})
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin alertas en esta categoría. Todo en orden.
              </p>
            ) : (
              <ul>
                {activeAlerts.map((item) => (
                  <AlertRow key={item.id} item={item} />
                ))}
              </ul>
            )}
            <Link
              href="/admin/inventario"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Gestionar inventario
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos por estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statusEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay pedidos.</p>
              ) : (
                statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">{count}</span>
                  </div>
                ))
              )}
              <Link
                href="/admin/pedidos"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                Ver pedidos
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Más vendidos · 30 días</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas registradas.</p>
              ) : (
                stats.topProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-foreground">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{p.quantity}</span> uds
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {formatNumber(stats.inventory.products)}
          </span>{" "}
          productos
        </span>
        <span>
          <span className="font-semibold text-foreground">
            {formatNumber(stats.inventory.variants)}
          </span>{" "}
          variantes
        </span>
        <span>
          <span className="font-semibold text-foreground">
            {formatNumber(stats.inventory.units)}
          </span>{" "}
          unidades en stock
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PackageX className="h-4 w-4" aria-hidden="true" />
          {formatNumber(stats.inventory.outOfStock)} agotadas
        </span>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import type { DashboardStats } from "@/lib/admin-types";
import { requireAdminApi } from "@/lib/auth-guard";

const TZ = "America/Bogota";

/** Offset (en minutos) de la zona horaria dada respecto a UTC para esa fecha. */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

function startOfTodayInTz(now: Date): Date {
  const offset = tzOffsetMinutes(now, TZ);
  const local = new Date(now.getTime() + offset * 60000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset * 60000
  );
}

function startOfMonthInTz(now: Date): Date {
  const offset = tzOffsetMinutes(now, TZ);
  const local = new Date(now.getTime() + offset * 60000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - offset * 60000);
}

interface StockCounts {
  low: bigint;
  out: bigint;
}

interface TopRow {
  id: string;
  name: string;
  quantity: bigint;
  revenue: number;
}

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const startToday = startOfTodayInTz(now);
    const startMonth = startOfMonthInTz(now);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      salesToday,
      salesMonth,
      byStatus,
      productCount,
      variantAgg,
      stockCounts,
      lowStockRows,
      outStockRows,
      topRows,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELADO" }, createdAt: { gte: startToday } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELADO" }, createdAt: { gte: startMonth } },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.product.count(),
      prisma.productVariant.aggregate({ _sum: { stock: true }, _count: { _all: true } }),
      prisma.$queryRaw<StockCounts[]>`
        SELECT
          COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0 AND min_stock > 0) AS low,
          COUNT(*) FILTER (WHERE stock <= 0) AS out
        FROM product_variants
      `,
      prisma.productVariant.findMany({
        where: { stock: { gt: 0 }, minStock: { gt: 0 } },
        select: {
          id: true,
          name: true,
          barcode: true,
          stock: true,
          minStock: true,
          product: { select: { name: true } },
        },
        orderBy: { stock: "asc" },
        take: 60,
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 0 } },
        select: {
          id: true,
          name: true,
          barcode: true,
          stock: true,
          minStock: true,
          product: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 60,
      }),
      prisma.$queryRaw<TopRow[]>`
        SELECT
          oi.product_id AS id,
          p.name AS name,
          SUM(oi.quantity) AS quantity,
          SUM(oi.quantity * oi.price_unitario) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status <> 'CANCELADO' AND o.created_at >= ${thirtyDaysAgo}
        GROUP BY oi.product_id, p.name
        ORDER BY quantity DESC
        LIMIT 5
      `,
    ]);

    const lowStock = lowStockRows.filter((v) => v.stock <= v.minStock);
    const counts = stockCounts[0];

    const statusMap: Partial<Record<OrderStatus, number>> = {};
    for (const g of byStatus) statusMap[g.status] = g._count._all;
    const orderCount = byStatus.reduce((sum, g) => sum + g._count._all, 0);
    const open =
      (statusMap.NUEVO ?? 0) + (statusMap.CONFIRMADO ?? 0) + (statusMap.PAGADO ?? 0);

    const payload: DashboardStats = {
      sales: {
        today: Number(salesToday._sum.total ?? 0),
        month: Number(salesMonth._sum.total ?? 0),
      },
      orders: {
        total: orderCount,
        byStatus: statusMap as Record<string, number>,
        open,
      },
      inventory: {
        products: productCount,
        variants: variantAgg._count._all,
        units: variantAgg._sum.stock ?? 0,
        lowStock: counts ? Number(counts.low) : 0,
        outOfStock: counts ? Number(counts.out) : 0,
      },
      alerts: {
        lowStock: lowStock.slice(0, 6).map((v) => ({
          id: v.id,
          product: v.product.name,
          variant: v.name,
          barcode: v.barcode,
          stock: v.stock,
          minStock: v.minStock,
        })),
        outOfStock: outStockRows.slice(0, 6).map((v) => ({
          id: v.id,
          product: v.product.name,
          variant: v.name,
          barcode: v.barcode,
          stock: v.stock,
          minStock: v.minStock,
        })),
      },
      topProducts: topRows.map((g) => ({
        id: g.id,
        name: g.name,
        quantity: Number(g.quantity),
        revenue: Number(g.revenue),
      })),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ error: "No se pudo cargar el dashboard" }, { status: 400 });
  }
}

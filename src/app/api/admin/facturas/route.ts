import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const where: Prisma.InvoiceWhereInput = {};
    if (status) where.status = status as never;
    if (desde || hasta) {
      const fecha: Prisma.DateTimeFilter = {};
      if (desde) fecha.gte = new Date(`${desde}T00:00:00.000`);
      if (hasta) fecha.lte = new Date(`${hasta}T23:59:59.999`);
      where.fecha = fecha;
    }

    const invoices = await prisma.invoice.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { fecha: "desc" },
      take: 200,
      include: {
        order: {
          select: {
            id: true,
            canal: true,
            customer: { select: { name: true, phone: true } },
          },
        },
      },
    });

    const totals = invoices.reduce(
      (acc, inv) => {
        if (inv.status !== "ANULADA") {
          acc.total += Number(inv.total);
          acc.impuestos += Number(inv.impuestos);
        }
        return acc;
      },
      { total: 0, impuestos: 0 }
    );

    return NextResponse.json({
      totals,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        numero: inv.numero,
        status: inv.status,
        total: Number(inv.total),
        impuestos: Number(inv.impuestos),
        fecha: inv.fecha,
        orderId: inv.order.id,
        canal: inv.order.canal,
        customer: inv.order.customer,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/facturas error:", error);
    return NextResponse.json({ error: "No se pudieron cargar las facturas" }, { status: 500 });
  }
}

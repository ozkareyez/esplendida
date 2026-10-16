import { NextRequest, NextResponse } from "next/server";
import type { DeliveryMethod, OrderStatus } from "@prisma/client";
import { getSession, requireAdminApi } from "@/lib/auth-guard";
import { changeOrderStatus, OrderError } from "@/lib/orders";

const STATUSES: OrderStatus[] = ["NUEVO", "CONFIRMADO", "PAGADO", "ENTREGADO", "CANCELADO"];
const DELIVERY: DeliveryMethod[] = ["DOMICILIO", "TIENDA"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
        items: {
          include: {
            variant: { select: { id: true, name: true, sku: true } },
            product: { select: { id: true, name: true, slug: true } },
          },
        },
        movements: {
          orderBy: { createdAt: "desc" },
          include: { variant: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      canal: order.canal,
      entregaMetodo: order.entregaMetodo,
      total: Number(order.total),
      notas: order.notas,
      createdAt: order.createdAt,
      customer: order.customer,
      invoice: order.invoice
        ? {
            id: order.invoice.id,
            numero: order.invoice.numero,
            status: order.invoice.status,
            total: Number(order.invoice.total),
            impuestos: Number(order.invoice.impuestos),
          }
        : null,
      items: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        priceUnitario: Number(i.priceUnitario),
        variant: i.variant,
        product: i.product,
      })),
      movements: order.movements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        stockAfter: m.stockAfter,
        variant: m.variant,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/pedidos/[id] error:", error);
    return NextResponse.json({ error: "No se pudo cargar el pedido" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const session = await getSession();
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const data: { notas?: string | null; entregaMetodo?: DeliveryMethod } = {};
      if (body.notas !== undefined) data.notas = body.notas || null;
      if (DELIVERY.includes(body.entregaMetodo)) data.entregaMetodo = body.entregaMetodo;
      if (Object.keys(data).length > 0) {
        await tx.order.update({ where: { id }, data });
      }

      if (body.status && STATUSES.includes(body.status)) {
        await changeOrderStatus(tx, id, body.status, session?.user.id ?? null);
      }

      return tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          notas: true,
          entregaMetodo: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/admin/pedidos/[id] error:", error);
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 });
  }
}

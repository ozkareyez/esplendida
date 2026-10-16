import { NextRequest, NextResponse } from "next/server";
import type { OrderChannel, DeliveryMethod, Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";
import { createOrder, OrderError } from "@/lib/orders";

const CHANNELS: OrderChannel[] = ["WHATSAPP", "WEB"];
const DELIVERY: DeliveryMethod[] = ["DOMICILIO", "TIENDA"];
const CHANNEL_FILTERS: OrderChannel[] = ["WHATSAPP", "WEB", "MOSTRADOR"];

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const canal = searchParams.get("canal");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as never;
    if (canal && CHANNEL_FILTERS.includes(canal as OrderChannel)) {
      where.canal = canal as OrderChannel;
    }
    if (desde || hasta) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (desde) createdAt.gte = new Date(`${desde}T00:00:00.000`);
      if (hasta) createdAt.lte = new Date(`${hasta}T23:59:59.999`);
      where.createdAt = createdAt;
    }

    const orders = await prisma.order.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { id: true, name: true, phone: true, city: true } },
        invoice: { select: { id: true, numero: true, status: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        canal: o.canal,
        entregaMetodo: o.entregaMetodo,
        total: Number(o.total),
        notas: o.notas,
        createdAt: o.createdAt,
        customer: o.customer,
        invoice: o.invoice,
        itemCount: o._count.items,
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/pedidos error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los pedidos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();

    const canal: OrderChannel = CHANNELS.includes(body.canal) ? body.canal : "WHATSAPP";
    const entregaMetodo: DeliveryMethod = DELIVERY.includes(body.entregaMetodo)
      ? body.entregaMetodo
      : "DOMICILIO";

    const order = await prisma.$transaction((tx) =>
      createOrder(tx, {
        canal,
        entregaMetodo,
        notas: body.notas || null,
        customer: {
          name: body.customer?.name ?? "",
          phone: body.customer?.phone ?? "",
          city: body.customer?.city ?? null,
          address: body.customer?.address ?? null,
        },
        items: Array.isArray(body.items) ? body.items : [],
      })
    );

    return NextResponse.json(
      {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        customer: order.customer,
        items: order.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          priceUnitario: Number(i.priceUnitario),
          variant: i.variant,
          product: i.product,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/pedidos error:", error);
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear el pedido" }, { status: 500 });
  }
}

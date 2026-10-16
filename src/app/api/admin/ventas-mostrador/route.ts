import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdminApi } from "@/lib/auth-guard";
import { createCounterSale, OrderError } from "@/lib/orders";

interface RawItem {
  variantId?: string;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const session = await getSession();
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();

    const items = Array.isArray(body.items)
      ? (body.items as RawItem[])
          .map((i) => ({
            variantId: String(i?.variantId ?? ""),
            quantity: Number(i?.quantity ?? 0),
          }))
          .filter((i) => i.variantId && Number.isInteger(i.quantity) && i.quantity > 0)
      : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Agrega al menos un producto" }, { status: 400 });
    }

    const result = await prisma.$transaction((tx) =>
      createCounterSale(
        tx,
        {
          items,
          notas: typeof body.notas === "string" ? body.notas : null,
          customer: body.customer ?? null,
        },
        session?.user.id ?? null
      )
    );

    return NextResponse.json(
      {
        orderId: result.order.id,
        total: Number(result.order.total),
        invoice: result.invoice
          ? {
              id: result.invoice.id,
              numero: result.invoice.numero,
              status: result.invoice.status,
              total: Number(result.invoice.total),
              impuestos: Number(result.invoice.impuestos),
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/ventas-mostrador error:", error);
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo registrar la venta" }, { status: 500 });
  }
}

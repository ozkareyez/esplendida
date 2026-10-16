import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderError } from "@/lib/orders";

interface RawItem {
  variantId?: string;
  productId?: string;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Necesitamos tu nombre y teléfono" },
        { status: 400 }
      );
    }

    const entregaMetodo = body.entrega === "tienda" ? "TIENDA" : "DOMICILIO";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";

    const rawItems: RawItem[] = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const items: { variantId: string; quantity: number }[] = [];
    for (const item of rawItems) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) continue;

      if (typeof item.variantId === "string" && item.variantId) {
        items.push({ variantId: item.variantId, quantity: qty });
      } else if (typeof item.productId === "string" && item.productId) {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (variant) items.push({ variantId: variant.id, quantity: qty });
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Los productos del carrito ya no están disponibles" },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction((tx) =>
      createOrder(tx, {
        canal: "WEB",
        entregaMetodo,
        notas: typeof body.notes === "string" ? body.notes.slice(0, 500) : null,
        customer: {
          name,
          phone,
          city: city || null,
          address: address || city || null,
        },
        items,
      })
    );

    return NextResponse.json(
      {
        id: order.id,
        numero: order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        total: Number(order.total),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pedidos error:", error);
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear el pedido" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import type { MovementType, Prisma } from "@prisma/client";
import { getSession, requireAdminApi } from "@/lib/auth-guard";
import { applyStockMovement, InventoryError } from "@/lib/inventory";

const TYPE_LABELS: MovementType[] = ["ENTRADA", "SALIDA", "AJUSTE"];

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 500);

    const where: Prisma.InventoryMovementWhereInput = {};
    if (variantId) where.variantId = variantId;
    if (type && TYPE_LABELS.includes(type as MovementType)) {
      where.type = type as MovementType;
    }
    if (q) {
      where.variant = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { product: { name: { contains: q, mode: "insensitive" } } },
        ],
      };
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            product: {
              select: {
                name: true,
                slug: true,
                brand: { select: { name: true } },
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      movements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        stockAfter: m.stockAfter,
        motivo: m.motivo,
        orderId: m.orderId,
        variant: m.variant,
        createdAt: m.createdAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/inventario/movimientos error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los movimientos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const session = await getSession();
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const { variantId, type, quantity, motivo } = body;

    if (!variantId || !TYPE_LABELS.includes(type)) {
      return NextResponse.json({ error: "Variante o tipo inválidos" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser un entero mayor o igual a cero" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      });
      if (!variant) throw new InventoryError("Variante no encontrada");

      let delta: number;
      if (type === "ENTRADA") {
        delta = qty;
      } else if (type === "SALIDA") {
        delta = -qty;
      } else {
        delta = qty - variant.stock;
      }

      const movement = await applyStockMovement(tx, {
        variantId,
        type: type as MovementType,
        delta,
        motivo: motivo || null,
        createdById: session?.user.id ?? null,
      });

      return movement;
    });

    return NextResponse.json(
      {
        id: result.id,
        type: result.type,
        quantity: result.quantity,
        stockAfter: result.stockAfter,
        motivo: result.motivo,
        createdAt: result.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/inventario/movimientos error:", error);
    if (error instanceof InventoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo registrar el movimiento" }, { status: 500 });
  }
}

import type { Prisma, MovementType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface StockMovementInput {
  variantId: string;
  type: MovementType;
  /** Delta con signo aplicado al stock: ENTRADA > 0, SALIDA < 0, AJUSTE cualquiera. */
  delta: number;
  motivo?: string | null;
  orderId?: string | null;
  createdById?: string | null;
}

export class InventoryError extends Error {}

/**
 * Aplica un movimiento de inventario de forma atómica: actualiza el stock de la
 * variante y registra el `InventoryMovement` con el stock resultante.
 * Debe ejecutarse dentro de una transacción (`prisma.$transaction`).
 */
export async function applyStockMovement(tx: Tx, input: StockMovementInput) {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new InventoryError("La cantidad del movimiento debe ser un entero distinto de cero");
  }

  const variant = await tx.productVariant.findUnique({
    where: { id: input.variantId },
    select: { stock: true },
  });

  if (!variant) {
    throw new InventoryError("Variante no encontrada");
  }

  const stockAfter = variant.stock + input.delta;
  if (stockAfter < 0) {
    throw new InventoryError(
      `Stock insuficiente: disponible ${variant.stock}, solicitado ${Math.abs(input.delta)}`
    );
  }

  await tx.productVariant.update({
    where: { id: input.variantId },
    data: { stock: stockAfter },
  });

  return tx.inventoryMovement.create({
    data: {
      variantId: input.variantId,
      type: input.type,
      quantity: input.delta,
      stockAfter,
      motivo: input.motivo ?? null,
      orderId: input.orderId ?? null,
      createdById: input.createdById ?? null,
    },
  });
}

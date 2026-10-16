import type { Prisma, OrderChannel, DeliveryMethod, OrderStatus } from "@prisma/client";
import { applyStockMovement, InventoryError } from "@/lib/inventory";
import {
  annulInvoiceForOrder,
  generateInvoiceForOrder,
  markInvoicePaid,
} from "@/lib/invoice";

type Tx = Prisma.TransactionClient;

export interface OrderCustomerInput {
  name: string;
  phone: string;
  city?: string | null;
  address?: string | null;
}

export interface OrderItemInput {
  variantId: string;
  quantity: number;
}

export interface CreateOrderInput {
  canal: OrderChannel;
  entregaMetodo: DeliveryMethod;
  notas?: string | null;
  customer: OrderCustomerInput;
  items: OrderItemInput[];
}

export class OrderError extends Error {}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NUEVO: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["PAGADO", "CANCELADO"],
  PAGADO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

async function resolveCustomer(tx: Tx, customer: OrderCustomerInput) {
  const phone = customer.phone.trim();
  const existing = await tx.customer.findFirst({ where: { phone } });

  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        name: customer.name.trim() || existing.name,
        city: customer.city ?? existing.city,
        address: customer.address ?? existing.address,
      },
    });
  }

  return tx.customer.create({
    data: {
      name: customer.name.trim(),
      phone,
      city: customer.city ?? null,
      address: customer.address ?? null,
    },
  });
}

/**
 * Crea un pedido con sus ítems. No descuenta stock: eso ocurre al confirmar.
 * Debe ejecutarse dentro de una transacción.
 */
export async function createOrder(tx: Tx, input: CreateOrderInput) {
  if (!input.items || input.items.length === 0) {
    throw new OrderError("El pedido debe tener al menos un producto");
  }
  if (!input.customer?.name?.trim() || !input.customer?.phone?.trim()) {
    throw new OrderError("El cliente requiere nombre y teléfono");
  }

  const variantIds = input.items.map((i) => i.variantId);
  const variants = await tx.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, productId: true, price: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  let total = 0;
  const itemsData = input.items.map((item) => {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new OrderError("Las cantidades deben ser enteros positivos");
    }
    const variant = byId.get(item.variantId);
    if (!variant) throw new OrderError("Una de las variantes no existe");
    const price = Number(variant.price);
    total += price * qty;
    return {
      variantId: variant.id,
      productId: variant.productId,
      quantity: qty,
      priceUnitario: price,
    };
  });

  const customer = await resolveCustomer(tx, input.customer);

  return tx.order.create({
    data: {
      customerId: customer.id,
      canal: input.canal,
      entregaMetodo: input.entregaMetodo,
      notas: input.notas ?? null,
      total,
      status: "NUEVO",
      items: { create: itemsData },
    },
    include: {
      customer: true,
      items: {
        include: {
          variant: { select: { id: true, name: true, sku: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
}

/** Descuenta stock (SALIDA) para un pedido, de forma idempotente. */
export async function deductOrderStock(tx: Tx, orderId: string, createdById?: string | null) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, movements: { select: { id: true } } },
  });
  if (!order) throw new OrderError("Pedido no encontrado");
  if (order.movements.length > 0) return;
  if (order.items.length === 0) throw new OrderError("El pedido no tiene ítems");

  for (const item of order.items) {
    try {
      await applyStockMovement(tx, {
        variantId: item.variantId,
        type: "SALIDA",
        delta: -item.quantity,
        motivo: `Venta pedido ${order.id.slice(0, 8)}`,
        orderId: order.id,
        createdById: createdById ?? null,
      });
    } catch (error) {
      if (error instanceof InventoryError) throw new OrderError(error.message);
      throw error;
    }
  }
}

/** Restaura stock de un pedido cancelado, de forma idempotente. */
export async function restoreOrderStock(tx: Tx, orderId: string, createdById?: string | null) {
  const grouped = await tx.inventoryMovement.groupBy({
    by: ["variantId"],
    where: { orderId },
    _sum: { quantity: true },
  });

  for (const row of grouped) {
    const net = row._sum.quantity ?? 0;
    if (net < 0) {
      await applyStockMovement(tx, {
        variantId: row.variantId,
        type: "ENTRADA",
        delta: -net,
        motivo: `Cancelación pedido ${orderId.slice(0, 8)}`,
        orderId,
        createdById: createdById ?? null,
      });
    }
  }
}

export interface UpdateOrderStatusResult {
  order: { id: string; status: OrderStatus };
}

export async function changeOrderStatus(
  tx: Tx,
  orderId: string,
  nextStatus: OrderStatus,
  createdById?: string | null
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) throw new OrderError("Pedido no encontrado");

  if (order.status === nextStatus) return order;
  if (!canTransition(order.status, nextStatus)) {
    throw new OrderError(`Transición no permitida: ${order.status} → ${nextStatus}`);
  }

  if (nextStatus === "CONFIRMADO") {
    await deductOrderStock(tx, orderId, createdById);
    await generateInvoiceForOrder(tx, orderId);
  } else if (nextStatus === "PAGADO") {
    await markInvoicePaid(tx, orderId);
  } else if (nextStatus === "CANCELADO") {
    await restoreOrderStock(tx, orderId, createdById);
    await annulInvoiceForOrder(tx, orderId);
  }

  const updated = await tx.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });

  return updated;
}

export interface CounterSaleInput {
  items: OrderItemInput[];
  customer?: OrderCustomerInput | null;
  notas?: string | null;
}

/**
 * Venta directa en tienda (mostrador): crea el pedido, descuenta stock,
 * emite la factura y la marca como PAGADA en una sola operación.
 */
export async function createCounterSale(
  tx: Tx,
  input: CounterSaleInput,
  createdById?: string | null
) {
  const order = await createOrder(tx, {
    canal: "MOSTRADOR",
    entregaMetodo: "TIENDA",
    notas: input.notas ?? "Venta en tienda",
    customer: {
      name: input.customer?.name?.trim() || "Consumidor final",
      phone: input.customer?.phone?.trim() || "MOSTRADOR",
      city: input.customer?.city ?? null,
      address: input.customer?.address ?? null,
    },
    items: input.items,
  });

  await changeOrderStatus(tx, order.id, "CONFIRMADO", createdById);
  await changeOrderStatus(tx, order.id, "PAGADO", createdById);

  const invoice = await tx.invoice.findUnique({ where: { orderId: order.id } });
  return { order, invoice };
}

export { InventoryError };

export type OrderStatus = "NUEVO" | "CONFIRMADO" | "PAGADO" | "ENTREGADO" | "CANCELADO";
export type InvoiceStatus = "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA";
export type Canal = "WHATSAPP" | "WEB" | "MOSTRADOR";
export type Entrega = "DOMICILIO" | "TIENDA";

export const STATUS_STYLES: Record<string, string> = {
  NUEVO: "bg-blue-500/10 text-blue-700",
  CONFIRMADO: "bg-amber-500/10 text-amber-700",
  PAGADO: "bg-emerald-500/10 text-emerald-700",
  ENTREGADO: "bg-green-500/10 text-green-700",
  CANCELADO: "bg-destructive/10 text-destructive",
  PENDIENTE: "bg-gray-500/10 text-gray-700",
  EMITIDA: "bg-amber-500/10 text-amber-700",
  ANULADA: "bg-destructive/10 text-destructive",
};

export const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  CONFIRMADO: "Confirmado",
  PAGADO: "Pagado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  PENDIENTE: "Pendiente",
  EMITIDA: "Emitida",
  ANULADA: "Anulada",
};

export const CANAL_LABELS: Record<Canal, string> = {
  WHATSAPP: "WhatsApp",
  WEB: "Web",
  MOSTRADOR: "Mostrador",
};

export const DELIVERY_LABELS: Record<Entrega, string> = {
  DOMICILIO: "Domicilio",
  TIENDA: "Tienda",
};

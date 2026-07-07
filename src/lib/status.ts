export const ORDER_STATUSES = [
  "RECEIVED",
  "DIAGNOSIS",
  "WAITING_APPROVAL",
  "IN_REPAIR",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "CANCELLED";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Recibido",
  DIAGNOSIS: "Diagnóstico",
  WAITING_APPROVAL: "Esperando aprobación",
  IN_REPAIR: "En reparación",
  QUALITY_CHECK: "Control de calidad",
  READY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

// Descripción corta que ve el cliente en la página de seguimiento
export const STATUS_HINTS: Record<OrderStatus, string> = {
  RECEIVED: "Tu vehículo ingresó al taller y está en cola de revisión.",
  DIAGNOSIS: "Estamos revisando tu vehículo para identificar el trabajo necesario.",
  WAITING_APPROVAL: "Tenemos un presupuesto listo. Esperamos tu aprobación para continuar.",
  IN_REPAIR: "Manos a la obra: tu vehículo está siendo reparado.",
  QUALITY_CHECK: "Reparación terminada. Estamos verificando que todo quede perfecto.",
  READY: "¡Tu vehículo está listo! Puedes pasar a recogerlo.",
  DELIVERED: "Vehículo entregado. Gracias por confiar en nosotros.",
  CANCELLED: "Esta orden fue cancelada. Contacta al taller para más detalles.",
};

export const VEHICLE_TYPES = ["CAR", "MOTORCYCLE", "TRUCK"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Camión",
};

// Adjetivo "listo/lista" según género del sustantivo
export const VEHICLE_TYPE_READY: Record<VehicleType, string> = {
  CAR: "listo",
  MOTORCYCLE: "lista",
  TRUCK: "listo",
};

export const VEHICLE_TYPE_PLURALS: Record<VehicleType, string> = {
  CAR: "carros",
  MOTORCYCLE: "motos",
  TRUCK: "camiones",
};

export const ITEM_KINDS = ["LABOR", "PART"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  LABOR: "Mano de obra",
  PART: "Repuesto",
};

export function statusIndex(status: string): number {
  return ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]);
}

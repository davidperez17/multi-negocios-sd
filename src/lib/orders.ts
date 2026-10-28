import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { generateCostCode, generateTrackingCode } from "./format";
import { ORDER_STATUSES, STATUS_LABELS, VEHICLE_TYPES, type OrderStatus } from "./status";

// Lógica de órdenes del admin, separada de los server actions para poder probarla.
// Regla: toda función recibe el tenantId de la sesión y nunca confía en ids del form.

export class DomainError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "DomainError";
  }
}

type Tx = Prisma.TransactionClient;

export type CreateOrderInput = {
  customerId?: string;
  customer?: { name: string; phone: string };
  vehicleId?: string;
  vehicle?: { type: string; brand: string; model: string; year: number | null; plate: string };
  concern: string;
  estimatedAt: Date | null;
};

function isUniqueViolation(e: unknown, field: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  return JSON.stringify(e.meta ?? {}).includes(field);
}

export async function createOrder(tenantId: string, input: CreateOrderInput): Promise<{ id: string }> {
  // Reintenta solo si el código de seguimiento aleatorio colisiona
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction((tx) => createOrderTx(tx, tenantId, input));
    } catch (e) {
      if (attempt < 2 && isUniqueViolation(e, "trackingCode")) continue;
      throw e;
    }
  }
}

async function createOrderTx(tx: Tx, tenantId: string, input: CreateOrderInput) {
  let customerId: string;
  if (input.customerId) {
    const customer = await tx.customer.findFirst({ where: { id: input.customerId, tenantId } });
    if (!customer) throw new DomainError("customer_not_found");
    customerId = customer.id;
  } else if (input.customer) {
    const customer = await tx.customer.create({ data: { tenantId, ...input.customer } });
    customerId = customer.id;
  } else {
    throw new DomainError("customer_required");
  }

  let vehicleId: string;
  if (input.vehicleId) {
    // El vehículo debe ser del mismo tenant y del cliente de la orden
    const vehicle = await tx.vehicle.findFirst({ where: { id: input.vehicleId, tenantId, customerId } });
    if (!vehicle) throw new DomainError("vehicle_not_found");
    vehicleId = vehicle.id;
  } else if (input.vehicle) {
    if (!VEHICLE_TYPES.includes(input.vehicle.type as (typeof VEHICLE_TYPES)[number])) {
      throw new DomainError("invalid_vehicle");
    }
    const vehicle = await tx.vehicle.create({ data: { tenantId, customerId, ...input.vehicle } });
    vehicleId = vehicle.id;
  } else {
    throw new DomainError("vehicle_required");
  }

  return tx.workOrder.create({
    data: {
      tenantId,
      customerId,
      vehicleId,
      trackingCode: generateTrackingCode(),
      costCode: generateCostCode(),
      concern: input.concern,
      estimatedAt: input.estimatedAt,
      updates: {
        create: { message: "Vehículo recibido. Ingresa a cola de diagnóstico.", status: "RECEIVED" },
      },
    },
    select: { id: true },
  });
}

// ── Estado ────────────────────────────────────────────────────────

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s) || s === "CANCELLED";
}

export async function changeStatus(
  tenantId: string,
  orderId: string,
  status: string,
  opts: { fromStatus?: string; message?: string }
) {
  if (!isOrderStatus(status)) throw new DomainError("invalid_status");

  await prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new DomainError("order_not_found");
    // Formulario abierto en otra pestaña con un estado viejo: no pisar el cambio de otro
    if (opts.fromStatus && opts.fromStatus !== order.status) throw new DomainError("stale_status");

    const reopensApproval = status === "WAITING_APPROVAL" && order.status !== "WAITING_APPROVAL";
    const { count } = await tx.workOrder.updateMany({
      where: { id: orderId, tenantId, status: order.status },
      data: {
        status,
        deliveredAt: status === "DELIVERED" ? (order.deliveredAt ?? new Date()) : null,
        ...(reopensApproval ? { approvedAt: null, approvedTotalCents: null } : {}),
      },
    });
    if (count === 0) throw new DomainError("stale_status");

    await tx.progressUpdate.create({
      data: {
        workOrderId: orderId,
        message: opts.message || `Estado actualizado: ${STATUS_LABELS[status]}.`,
        status,
      },
    });
  });
}

// ── Conceptos / costos ────────────────────────────────────────────

export const MAX_QUANTITY = 999;
export const MAX_UNIT_CENTS = 100_000_000; // Q1,000,000.00

export type ItemInput = { kind: string; description: string; quantity: number; unitCents: number };

/** Si el presupuesto ya estaba aprobado, cualquier cambio exige una aprobación nueva. */
async function invalidateApproval(tx: Tx, order: { id: string; approvedAt: Date | null }) {
  if (!order.approvedAt) return;
  await tx.workOrder.update({
    where: { id: order.id },
    data: {
      approvedAt: null,
      approvedTotalCents: null,
      status: "WAITING_APPROVAL",
      updates: {
        create: {
          message: "El presupuesto cambió. Se requiere una nueva aprobación del cliente.",
          status: "WAITING_APPROVAL",
        },
      },
    },
  });
}

export async function addItem(tenantId: string, orderId: string, item: ItemInput) {
  const description = item.description.trim();
  if (!description || description.length > 200) throw new DomainError("invalid_item");
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
    throw new DomainError("invalid_item");
  }
  if (!Number.isInteger(item.unitCents) || item.unitCents < 1 || item.unitCents > MAX_UNIT_CENTS) {
    throw new DomainError("invalid_item");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new DomainError("order_not_found");
    await tx.workOrderItem.create({
      data: {
        workOrderId: orderId,
        kind: item.kind === "PART" ? "PART" : "LABOR",
        description,
        quantity: item.quantity,
        unitCents: item.unitCents,
      },
    });
    await invalidateApproval(tx, order);
  });
}

/** Devuelve el id de la orden afectada (para revalidar), o null si no aplica. */
export async function deleteItem(tenantId: string, itemId: string): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.workOrderItem.findFirst({
      where: { id: itemId, workOrder: { tenantId } },
      include: { workOrder: true },
    });
    if (!item) return null;
    await tx.workOrderItem.delete({ where: { id: itemId } });
    await invalidateApproval(tx, item.workOrder);
    return item.workOrderId;
  });
}

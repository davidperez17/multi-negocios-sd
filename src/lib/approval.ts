import { prisma } from "./prisma";

export type ApproveResult =
  | { ok: true; approvedAt: Date }
  | { ok: false; error: "not_found" | "invalid_pin" | "not_approvable" | "budget_changed"; status: number };

/**
 * El cliente aprueba el presupuesto desde la página pública.
 * `totalCents` es el total que el cliente vio: si el taller lo cambió entretanto, se rechaza.
 */
export async function approveBudget(args: {
  slug: string;
  code: string;
  pin: string;
  totalCents: number;
}): Promise<ApproveResult> {
  const order = await prisma.workOrder.findUnique({
    where: { trackingCode: args.code.toUpperCase() },
    include: {
      tenant: { select: { slug: true } },
      items: { select: { quantity: true, unitCents: true } },
    },
  });

  if (!order || order.tenant.slug !== args.slug) return { ok: false, error: "not_found", status: 404 };
  if (!order.costCode || args.pin !== order.costCode) return { ok: false, error: "invalid_pin", status: 403 };
  // Idempotente: ya estaba aprobado
  if (order.approvedAt) return { ok: true, approvedAt: order.approvedAt };
  if (order.status !== "WAITING_APPROVAL" || order.items.length === 0) {
    return { ok: false, error: "not_approvable", status: 409 };
  }

  const total = order.items.reduce((sum, it) => sum + it.quantity * it.unitCents, 0);
  if (total !== args.totalCents) return { ok: false, error: "budget_changed", status: 409 };

  const approvedAt = new Date();
  const approved = await prisma.$transaction(async (tx) => {
    // Condicional: un doble clic concurrente solo aprueba una vez
    const { count } = await tx.workOrder.updateMany({
      where: { id: order.id, approvedAt: null, status: "WAITING_APPROVAL" },
      data: { approvedAt, approvedTotalCents: total },
    });
    if (count === 0) return false;
    await tx.progressUpdate.create({
      data: {
        workOrderId: order.id,
        message:
          "Presupuesto aprobado por el cliente desde la página de seguimiento. El taller continuará con la reparación.",
        status: "WAITING_APPROVAL",
      },
    });
    return true;
  });

  if (!approved) {
    const current = await prisma.workOrder.findUnique({ where: { id: order.id }, select: { approvedAt: true } });
    if (current?.approvedAt) return { ok: true, approvedAt: current.approvedAt };
    return { ok: false, error: "not_approvable", status: 409 };
  }
  return { ok: true, approvedAt };
}

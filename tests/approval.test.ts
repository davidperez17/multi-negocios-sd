import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { approveBudget } from "@/lib/approval";
import { makeTenantWithOrder, resetDb } from "./helpers";

beforeEach(resetDb);

async function withItems(cents: number[]) {
  const ctx = await makeTenantWithOrder({ status: "WAITING_APPROVAL" });
  for (const unitCents of cents) {
    await prisma.workOrderItem.create({
      data: { workOrderId: ctx.order.id, kind: "PART", description: "x", unitCents },
    });
  }
  return ctx;
}

describe("approveBudget", () => {
  it("aprueba y guarda el total aprobado", async () => {
    const { tenant, order } = await withItems([10000, 5000]);
    const res = await approveBudget({ slug: tenant.slug, code: order.trackingCode, pin: "12345", totalCents: 15000 });
    expect(res).toMatchObject({ ok: true });
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.approvedAt).not.toBeNull();
    expect(after.approvedTotalCents).toBe(15000);
  });

  it("rechaza si el total que vio el cliente ya no coincide", async () => {
    const { tenant, order } = await withItems([10000]);
    const res = await approveBudget({ slug: tenant.slug, code: order.trackingCode, pin: "12345", totalCents: 5000 });
    expect(res).toEqual({ ok: false, error: "budget_changed", status: 409 });
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.approvedAt).toBeNull();
  });

  it("no encuentra la orden con el slug de otro tenant", async () => {
    const a = await withItems([100]);
    const b = await makeTenantWithOrder();
    const res = await approveBudget({ slug: b.tenant.slug, code: a.order.trackingCode, pin: "12345", totalCents: 100 });
    expect(res).toEqual({ ok: false, error: "not_found", status: 404 });
  });

  it("doble envío simultáneo crea un solo avance de aprobación", async () => {
    const { tenant, order } = await withItems([100]);
    const args = { slug: tenant.slug, code: order.trackingCode, pin: "12345", totalCents: 100 };
    await Promise.all([approveBudget(args), approveBudget(args), approveBudget(args)]);
    const count = await prisma.progressUpdate.count({
      where: { workOrderId: order.id, message: { contains: "aprobado por el cliente" } },
    });
    expect(count).toBe(1);
  });

  it("PIN incorrecto → 403", async () => {
    const { tenant, order } = await withItems([100]);
    const res = await approveBudget({ slug: tenant.slug, code: order.trackingCode, pin: "00000", totalCents: 100 });
    expect(res).toEqual({ ok: false, error: "invalid_pin", status: 403 });
  });
});

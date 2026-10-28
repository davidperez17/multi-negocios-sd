import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublicTracking } from "@/lib/tracking";
import { approveBudget } from "@/lib/approval";
import { PIN_MAX_FAILURES } from "@/lib/cost-pin";
import { generateCostCode, generateTrackingCode } from "@/lib/format";
import { makeTenantWithOrder, resetDb } from "./helpers";

beforeEach(resetDb);
afterEach(() => vi.restoreAllMocks());

async function withItem() {
  const ctx = await makeTenantWithOrder();
  await prisma.workOrderItem.create({
    data: { workOrderId: ctx.order.id, kind: "PART", description: "Pastillas", unitCents: 50000 },
  });
  return ctx;
}

describe("getPublicTracking", () => {
  it("no encuentra un código de otro tenant", async () => {
    const a = await withItem();
    const b = await makeTenantWithOrder();
    expect(await getPublicTracking({ slug: b.tenant.slug, code: a.order.trackingCode, pin: null })).toBeNull();
  });

  it("sin PIN no devuelve items", async () => {
    const { tenant, order } = await withItem();
    const data = await getPublicTracking({ slug: tenant.slug, code: order.trackingCode, pin: null });
    expect(data?.costUnlocked).toBe(false);
    expect(data?.items).toEqual([]);
    expect(data?.hasItems).toBe(true);
  });

  it("con PIN correcto devuelve items", async () => {
    const { tenant, order } = await withItem();
    const data = await getPublicTracking({ slug: tenant.slug, code: order.trackingCode, pin: "12345" });
    expect(data?.costUnlocked).toBe(true);
    expect(data?.items).toHaveLength(1);
  });

  it("un costCode vacío nunca se desbloquea con PIN vacío", async () => {
    const { tenant, order } = await withItem();
    await prisma.$executeRaw`UPDATE WorkOrder SET costCode = '' WHERE id = ${order.id}`;
    const data = await getPublicTracking({ slug: tenant.slug, code: order.trackingCode, pin: "" });
    expect(data?.costUnlocked).toBe(false);
  });

  it(`bloquea el PIN tras ${PIN_MAX_FAILURES} intentos fallidos, aun con el PIN correcto`, async () => {
    const { tenant, order } = await withItem();
    const args = { slug: tenant.slug, code: order.trackingCode };
    for (let i = 0; i < PIN_MAX_FAILURES; i++) {
      await getPublicTracking({ ...args, pin: String(10000 + i) });
    }
    const data = await getPublicTracking({ ...args, pin: "12345" });
    expect(data?.costUnlocked).toBe(false);
    expect(data?.costLocked).toBe(true);
    expect(data?.items).toEqual([]);
  });

  it("el bloqueo también aplica a la aprobación", async () => {
    const { tenant, order } = await withItem();
    for (let i = 0; i < PIN_MAX_FAILURES; i++) {
      await approveBudget({ slug: tenant.slug, code: order.trackingCode, pin: "00000", totalCents: 50000 });
    }
    const res = await approveBudget({ slug: tenant.slug, code: order.trackingCode, pin: "12345", totalCents: 50000 });
    expect(res).toEqual({ ok: false, error: "pin_locked", status: 429 });
  });

  it("el bloqueo expira", async () => {
    const { tenant, order } = await withItem();
    await prisma.workOrder.update({
      where: { id: order.id },
      data: { pinLockedUntil: new Date(Date.now() - 1000) },
    });
    const data = await getPublicTracking({ slug: tenant.slug, code: order.trackingCode, pin: "12345" });
    expect(data?.costUnlocked).toBe(true);
  });

  it("un acierto reinicia el contador de fallos", async () => {
    const { tenant, order } = await withItem();
    const args = { slug: tenant.slug, code: order.trackingCode };
    for (let i = 0; i < PIN_MAX_FAILURES - 1; i++) await getPublicTracking({ ...args, pin: "00000" });
    await getPublicTracking({ ...args, pin: "12345" });
    await getPublicTracking({ ...args, pin: "00000" });
    const data = await getPublicTracking({ ...args, pin: "12345" });
    expect(data?.costUnlocked).toBe(true);
  });

  it("consultar sin PIN no cuenta como intento fallido", async () => {
    const { tenant, order } = await withItem();
    const args = { slug: tenant.slug, code: order.trackingCode };
    for (let i = 0; i < PIN_MAX_FAILURES + 2; i++) await getPublicTracking({ ...args, pin: null });
    expect((await getPublicTracking({ ...args, pin: "12345" }))?.costUnlocked).toBe(true);
  });
});

describe("códigos aleatorios", () => {
  it("no dependen de Math.random (predecible)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pins = new Set(Array.from({ length: 20 }, generateCostCode));
    const codes = new Set(Array.from({ length: 20 }, generateTrackingCode));
    expect(pins.size).toBeGreaterThan(1);
    expect(codes.size).toBeGreaterThan(1);
    for (const p of pins) expect(p).toMatch(/^\d{5}$/);
  });
});

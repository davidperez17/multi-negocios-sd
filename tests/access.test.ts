import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { activateTenant, tenantAccess } from "@/lib/access";
import { resetDb } from "./helpers";

beforeEach(resetDb);

const NOW = new Date("2026-10-28T15:00:00Z");
const days = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

describe("tenantAccess", () => {
  it("taller sin prueba ni pago (creado a mano) está activo", () => {
    expect(tenantAccess({ trialEndsAt: null, paidUntil: null }, NOW)).toEqual({ state: "active", daysLeft: null });
  });

  it("en prueba cuenta días restantes hacia arriba", () => {
    expect(tenantAccess({ trialEndsAt: days(30), paidUntil: null }, NOW)).toEqual({ state: "trial", daysLeft: 30 });
    expect(tenantAccess({ trialEndsAt: days(0.2), paidUntil: null }, NOW)).toEqual({ state: "trial", daysLeft: 1 });
  });

  it("prueba vencida y sin pago → expired", () => {
    expect(tenantAccess({ trialEndsAt: days(-1), paidUntil: null }, NOW).state).toBe("expired");
  });

  it("pago vigente manda aunque la prueba haya vencido", () => {
    expect(tenantAccess({ trialEndsAt: days(-5), paidUntil: days(10) }, NOW)).toEqual({ state: "active", daysLeft: null });
  });

  it("pago vencido → expired", () => {
    expect(tenantAccess({ trialEndsAt: days(-40), paidUntil: days(-1) }, NOW).state).toBe("expired");
  });
});

describe("activateTenant", () => {
  it("suma meses desde hoy si no había pago vigente", async () => {
    await prisma.tenant.create({ data: { slug: "a", name: "A", trialEndsAt: days(-3) } });
    const t = await activateTenant("a", 1, NOW);
    expect(t.paidUntil?.toISOString()).toBe("2026-11-28T15:00:00.000Z");
  });

  it("extiende desde el pago vigente, no desde hoy", async () => {
    await prisma.tenant.create({ data: { slug: "b", name: "B", paidUntil: days(10) } });
    const t = await activateTenant("b", 2, NOW);
    expect(t.paidUntil?.toISOString()).toBe("2027-01-07T15:00:00.000Z");
  });

  it("pagar durante la prueba no le quita los días que le quedaban", async () => {
    await prisma.tenant.create({ data: { slug: "d", name: "D", trialEndsAt: days(25) } });
    const t = await activateTenant("d", 1, NOW);
    // fin de prueba 2026-11-22 + 1 mes
    expect(t.paidUntil?.toISOString()).toBe("2026-12-22T15:00:00.000Z");
  });

  it("31 de enero + 1 mes = fin de febrero, no marzo", async () => {
    const jan31 = new Date("2027-01-31T15:00:00Z");
    await prisma.tenant.create({ data: { slug: "e", name: "E", paidUntil: jan31 } });
    const t = await activateTenant("e", 1, new Date("2027-01-10T00:00:00Z"));
    expect(t.paidUntil?.toISOString()).toBe("2027-02-28T15:00:00.000Z");
  });

  it("slug inexistente o meses inválidos lanzan", async () => {
    await expect(activateTenant("nope", 1, NOW)).rejects.toThrow();
    await prisma.tenant.create({ data: { slug: "c", name: "C" } });
    await expect(activateTenant("c", 0, NOW)).rejects.toThrow();
  });
});

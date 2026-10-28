import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticate, LOGIN_MAX_FAILURES } from "@/lib/login";
import { sessionSecret } from "@/lib/auth";
import { tenantThemeVars } from "@/lib/tenant";
import { DEFAULT_BRAND_COLOR } from "@/lib/validation";
import { resetDb } from "./helpers";

beforeEach(resetDb);
afterEach(() => vi.unstubAllEnvs());

async function makeUser() {
  const tenant = await prisma.tenant.create({ data: { slug: "auth-t", name: "T" } });
  return prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Marco",
      email: "marco@test.gt",
      passwordHash: await bcrypt.hash("correcta", 4),
    },
  });
}

describe("authenticate", () => {
  it("acepta credenciales válidas", async () => {
    await makeUser();
    const res = await authenticate("Marco@Test.gt ", "correcta");
    expect(res.ok).toBe(true);
  });

  it("email inexistente → invalid (sin revelar que no existe)", async () => {
    expect(await authenticate("nadie@test.gt", "x")).toEqual({ ok: false, reason: "invalid" });
  });

  it(`bloquea la cuenta tras ${LOGIN_MAX_FAILURES} fallos, aun con la contraseña correcta`, async () => {
    await makeUser();
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await authenticate("marco@test.gt", "mala");
    expect(await authenticate("marco@test.gt", "correcta")).toEqual({ ok: false, reason: "locked" });
  });

  it("un login exitoso reinicia el contador", async () => {
    await makeUser();
    for (let i = 0; i < LOGIN_MAX_FAILURES - 1; i++) await authenticate("marco@test.gt", "mala");
    expect((await authenticate("marco@test.gt", "correcta")).ok).toBe(true);
    await authenticate("marco@test.gt", "mala");
    expect((await authenticate("marco@test.gt", "correcta")).ok).toBe(true);
  });
});

describe("sessionSecret", () => {
  it("en producción falla si falta SESSION_SECRET", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => sessionSecret()).toThrow(/SESSION_SECRET/);
  });

  it("en producción falla si el secreto es corto", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "corto");
    expect(() => sessionSecret()).toThrow(/SESSION_SECRET/);
  });

  it("en producción acepta un secreto de 32+ caracteres", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    expect(sessionSecret()).toBe("x".repeat(32));
  });
});

describe("tenantThemeVars", () => {
  it("ignora un brandColor con CSS inyectado y usa el color por defecto", () => {
    const vars = tenantThemeVars("red;position:fixed;inset:0") as Record<string, string>;
    expect(vars["--color-primary"]).toBe(DEFAULT_BRAND_COLOR);
    expect(JSON.stringify(vars)).not.toContain("position");
  });

  it("respeta un oklch válido", () => {
    const vars = tenantThemeVars("oklch(0.5 0.16 250)") as Record<string, string>;
    expect(vars["--color-primary"]).toBe("oklch(0.5 0.16 250)");
  });
});

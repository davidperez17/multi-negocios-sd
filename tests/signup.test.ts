import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/login";
import { DomainError } from "@/lib/orders";
import { registerWorkshop, slugify, TRIAL_DAYS } from "@/lib/signup";
import { isValidEmail, isValidPassword, normalizeGtPhone, waNumber } from "@/lib/validation";
import { resetDb } from "./helpers";

beforeEach(resetDb);

const NOW = new Date("2026-10-28T15:00:00Z");
const input = {
  workshopName: "Taller Méndez Hermanos",
  ownerName: "Óscar Méndez",
  whatsapp: "5512 3456",
  email: "Oscar@TallerMendez.gt ",
  password: "segura123",
};

describe("slugify", () => {
  it.each([
    ["Taller Méndez Hermanos", "taller-mendez-hermanos"],
    ["  Moto  Garage #1 ", "moto-garage-1"],
    ["Ñandú & Cía.", "nandu-cia"],
    ["***", "taller"],
  ])("%j → %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("corta a 40 caracteres sin guion al final", () => {
    const s = slugify("Taller de Servicio Automotriz Integral de Chimaltenango Centro");
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("validación de registro", () => {
  it.each([
    ["5512 3456", "+502 5512 3456"],
    ["+502 5512-3456", "+502 5512 3456"],
    ["50255123456", "+502 5512 3456"],
  ])("teléfono %j → %s", (raw, out) => {
    expect(normalizeGtPhone(raw)).toBe(out);
  });

  it.each(["", "1234", "5512 34567", "abc"])("rechaza teléfono %j", (raw) => {
    expect(normalizeGtPhone(raw)).toBeNull();
  });

  it("waNumber deja solo dígitos para wa.me", () => {
    expect(waNumber("+502 5512-3456")).toBe("50255123456");
    expect(waNumber(null)).toBeNull();
    expect(waNumber(" - ")).toBeNull();
  });

  it("email y contraseña", () => {
    expect(isValidEmail("a@b.gt")).toBe(true);
    expect(isValidEmail("sin-arroba")).toBe(false);
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("x".repeat(73))).toBe(false); // bcrypt ignora más allá de 72 bytes
  });
});

describe("registerWorkshop", () => {
  it(`crea taller con ${TRIAL_DAYS} días de prueba y dueño ADMIN que puede entrar`, async () => {
    const res = await registerWorkshop(input, NOW);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: res.tenantId } });
    expect(tenant.slug).toBe("taller-mendez-hermanos");
    expect(tenant.name).toBe("Taller Méndez Hermanos");
    // wa.me solo acepta dígitos con código de país
    expect(tenant.whatsapp).toBe("50255123456");
    expect(tenant.phone).toBe("+502 5512 3456");
    expect(tenant.trialEndsAt?.toISOString()).toBe("2026-11-27T15:00:00.000Z");
    expect(tenant.paidUntil).toBeNull();

    const user = await prisma.user.findUniqueOrThrow({ where: { id: res.userId } });
    expect(user.role).toBe("ADMIN");
    expect(user.tenantId).toBe(tenant.id);
    expect(user.email).toBe("oscar@tallermendez.gt");
    expect(user.passwordHash).not.toContain("segura123");
    expect((await authenticate("oscar@tallermendez.gt", "segura123")).ok).toBe(true);
  });

  it("slug repetido recibe sufijo", async () => {
    await registerWorkshop(input, NOW);
    const b = await registerWorkshop({ ...input, email: "otro@x.gt" }, NOW);
    const c = await registerWorkshop({ ...input, email: "tercero@x.gt" }, NOW);
    expect(b.slug).toBe("taller-mendez-hermanos-2");
    expect(c.slug).toBe("taller-mendez-hermanos-3");
  });

  it("correo ya registrado → email_taken y no deja taller huérfano", async () => {
    await registerWorkshop(input, NOW);
    await expect(registerWorkshop({ ...input, workshopName: "Otro" }, NOW)).rejects.toThrow(
      new DomainError("email_taken")
    );
    expect(await prisma.tenant.count()).toBe(1);
  });

  it.each([
    [{ workshopName: " " }, "invalid_name"],
    [{ workshopName: "x".repeat(81) }, "invalid_name"],
    [{ ownerName: "" }, "invalid_owner"],
    [{ whatsapp: "123" }, "invalid_phone"],
    [{ email: "no-es-correo" }, "invalid_email"],
    [{ password: "corta" }, "weak_password"],
  ])("rechaza %j con %s", async (patch, code) => {
    await expect(registerWorkshop({ ...input, ...patch }, NOW)).rejects.toThrow(new DomainError(code));
    expect(await prisma.tenant.count()).toBe(0);
  });
});

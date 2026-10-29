import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/orders";
import { parseWeeklyHours } from "@/lib/hours";
import { saveAppearance, saveContact, saveServices } from "@/lib/tenant-settings";
import { makeTenantWithOrder, resetDb } from "./helpers";

beforeEach(resetDb);

let createdTenants: string[] = [];
afterEach(() => {
  for (const id of createdTenants) rmSync(path.join(process.cwd(), "public", "uploads", id), { recursive: true, force: true });
  createdTenants = [];
});

async function tenant() {
  const { tenant } = await makeTenantWithOrder();
  createdTenants.push(tenant.id);
  return tenant;
}

const png = () => {
  const buf = Buffer.alloc(2000);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf);
  return new File([buf], "logo.png", { type: "image/png" });
};

const split = JSON.stringify({
  0: [],
  1: [["08:00", "12:00"], ["14:00", "18:00"]],
  2: [["08:00", "12:00"], ["14:00", "18:00"]],
  3: [["08:00", "12:00"], ["14:00", "18:00"]],
  4: [["08:00", "12:00"], ["14:00", "18:00"]],
  5: [["08:00", "12:00"], ["14:00", "18:00"]],
  6: [["08:00", "13:00"]],
});

const appearance = (over: Partial<Parameters<typeof saveAppearance>[1]> = {}) => ({
  name: "Taller Prueba",
  tagline: "Mecánica general",
  brandColor: "#1e6fd9",
  heroStyle: "DOTS",
  foundedYear: "1998",
  showDeliveredCount: true,
  useWeeklyHours: false,
  weeklyHours: split,
  removeLogo: false,
  removeStorefront: false,
  ...over,
});

const fileOf = (url: string) => path.join(process.cwd(), "public", url);

describe("saveAppearance", () => {
  it("con el horario por día apagado no guarda horario aunque venga JSON válido", async () => {
    const t = await tenant();
    await saveAppearance(t.id, appearance());
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.weeklyHours).toBeNull();
    expect(after.heroStyle).toBe("DOTS");
    expect(after.foundedYear).toBe(1998);
    expect(after.name).toBe("Taller Prueba");
  });

  it("con el horario encendido guarda dos tramos tal cual", async () => {
    const t = await tenant();
    await saveAppearance(t.id, appearance({ useWeeklyHours: true }));
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(parseWeeklyHours(after.weeklyHours)).toEqual(parseWeeklyHours(split));
  });

  it("horario con traslape → invalid_hours y no cambia nada", async () => {
    const t = await tenant();
    const bad = JSON.stringify({ ...JSON.parse(split), 1: [["08:00", "13:00"], ["12:00", "14:00"]] });
    await expect(
      saveAppearance(t.id, appearance({ useWeeklyHours: true, weeklyHours: bad, name: "Otro nombre" }))
    ).rejects.toThrow(new DomainError("invalid_hours"));
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).name).toBe(t.name);
  });

  it.each([
    [{ heroStyle: "NEON" }, "invalid_style"],
    [{ foundedYear: "1850" }, "invalid_year"],
    [{ foundedYear: "3000" }, "invalid_year"],
    [{ name: "x" }, "invalid_name"],
    [{ brandColor: "azul" }, "color"],
  ])("%j → %s", async (over, code) => {
    const t = await tenant();
    await expect(saveAppearance(t.id, appearance(over))).rejects.toThrow(new DomainError(code));
  });

  it("año vacío se guarda como null; color muy claro se ajusta", async () => {
    const t = await tenant();
    const res = await saveAppearance(t.id, appearance({ foundedYear: "", brandColor: "#ffe14d" }));
    expect(res.colorAdjusted).toBe(true);
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).foundedYear).toBeNull();
  });

  it("reemplazar el logo borra el archivo anterior; quitarlo lo deja en null", async () => {
    const t = await tenant();
    await saveAppearance(t.id, appearance({ logo: png() }));
    const first = (await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).logoUrl!;
    expect(existsSync(fileOf(first))).toBe(true);

    await saveAppearance(t.id, appearance({ logo: png() }));
    const second = (await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).logoUrl!;
    expect(second).not.toBe(first);
    expect(existsSync(fileOf(first))).toBe(false);

    await saveAppearance(t.id, appearance({ removeLogo: true }));
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).logoUrl).toBeNull();
    expect(existsSync(fileOf(second))).toBe(false);
  });

  it("imagen que no es imagen → invalid_image sin cambiar nada", async () => {
    const t = await tenant();
    const fake = new File(["<html>"], "x.png", { type: "image/png" });
    await expect(saveAppearance(t.id, appearance({ storefront: fake, name: "Cambiado" }))).rejects.toThrow(
      new DomainError("invalid_image")
    );
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.name).toBe(t.name);
    expect(after.storefrontPhotoUrl).toBeNull();
  });
});

describe("saveContact", () => {
  const contact = { whatsapp: "5512 3456", phone: "2447 8890", email: "", address: "2a Av 3-45", city: "Chimaltenango", mapsUrl: "" };

  it("no toca logo ni horario de otras pestañas", async () => {
    const t = await tenant();
    await saveAppearance(t.id, appearance({ logo: png(), useWeeklyHours: true }));
    const before = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    await saveContact(t.id, contact);
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.logoUrl).toBe(before.logoUrl);
    expect(after.weeklyHours).toBe(before.weeklyHours);
    expect(after.whatsapp).toBe("50255123456");
    expect(after.city).toBe("Chimaltenango");
  });

  it.each([
    [{ mapsUrl: "https://evil.com/maps" }, "invalid_maps"],
    [{ mapsUrl: "http://maps.app.goo.gl/x" }, "invalid_maps"],
    [{ whatsapp: "123" }, "invalid_phone"],
    [{ email: "no-es-correo" }, "invalid_email"],
  ])("%j → %s", async (over, code) => {
    const t = await tenant();
    await expect(saveContact(t.id, { ...contact, ...over })).rejects.toThrow(new DomainError(code));
  });

  it("acepta links de Google Maps y WhatsApp vacío", async () => {
    const t = await tenant();
    await saveContact(t.id, { ...contact, whatsapp: "", mapsUrl: "https://maps.app.goo.gl/AbC123" });
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.mapsUrl).toBe("https://maps.app.goo.gl/AbC123");
    expect(after.whatsapp).toBeNull();
  });

  it("solo cambia el taller indicado", async () => {
    const a = await tenant();
    const b = await tenant();
    await saveContact(a.id, contact);
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: b.id } })).city).toBeNull();
  });
});

describe("saveServices", () => {
  it("limpia y deduplica servicios", async () => {
    const t = await tenant();
    await saveServices(t.id, { services: ["Frenos", "frenos", " ", " Afinación "], vehicleTypes: ["CAR"], description: "" });
    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.services).toBe("Frenos\nAfinación");
    expect(after.description).toBeNull();
  });

  it.each([
    [{ vehicleTypes: [] }, "invalid_services"],
    [{ vehicleTypes: ["BOAT"] }, "invalid_services"],
    [{ services: Array.from({ length: 21 }, (_, i) => `S${i}`) }, "invalid_services"],
    [{ services: ["x".repeat(61)] }, "invalid_services"],
  ])("%j → %s", async (over, code) => {
    const t = await tenant();
    await expect(
      saveServices(t.id, { services: ["Frenos"], vehicleTypes: ["CAR"], description: "", ...over })
    ).rejects.toThrow(new DomainError(code));
  });
});

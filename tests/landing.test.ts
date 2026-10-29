import { describe, expect, it } from "vitest";
import type { Tenant } from "@/generated/prisma/client";
import { buildLandingData, extractTrackingCode, heroBackground, mapsLinks, vehicleNoun } from "@/lib/landing";
import { DEFAULT_BRAND_COLOR } from "@/lib/validation";
import { DEFAULT_WEEKLY_HOURS } from "@/lib/hours";

const NOW = new Date("2026-10-27T16:00:00Z"); // martes 10:00 en Guatemala

function tenant(over: Partial<Tenant> = {}): Tenant {
  return {
    id: "t1",
    slug: "taller",
    name: "Taller Mínimo",
    tagline: null,
    description: null,
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    city: null,
    brandColor: DEFAULT_BRAND_COLOR,
    logoUrl: null,
    vehicleTypes: "CAR",
    services: null,
    schedule: null,
    trialEndsAt: null,
    paidUntil: null,
    ownerId: null,
    storefrontPhotoUrl: null,
    heroStyle: "GRADIENT",
    foundedYear: null,
    showDeliveredCount: true,
    mapsUrl: null,
    weeklyHours: null,
    createdAt: NOW,
    ...over,
  };
}

describe("extractTrackingCode", () => {
  it.each([
    ["tx-abc123", "TX-ABC123"],
    [" ABC 123 ", "TX-ABC123"],
    ["Mira tu carro: http://x/t/taller/seguimiento/TX-ABC123 gracias", "TX-ABC123"],
    ["TX-DEMO01", "TX-DEMO01"],
    // Códigos válidos que empiezan con TX (T y X están en el alfabeto)
    ["TXA234", "TX-TXA234"],
    ["txk9m2", "TX-TXK9M2"],
    ["TX-TXA234", "TX-TXA234"],
    // Slug con "tx-" en el link: gana el código después de /seguimiento/
    ["http://x/t/tx-motors/seguimiento/TX-ABC234", "TX-ABC234"],
  ])("%j → %s", (raw, code) => {
    expect(extractTrackingCode(raw)).toBe(code);
  });

  it.each(["hola", "TX-ABC12", "TX-ABC1234", ""])("rechaza %j", (raw) => {
    expect(extractTrackingCode(raw)).toBeNull();
  });
});

describe("vehicleNoun", () => {
  it.each([
    [["MOTORCYCLE"], { one: "moto", many: "motos", feminine: true }],
    [["TRUCK"], { one: "camión", many: "camiones", feminine: false }],
    [["CAR", "TRUCK"], { one: "carro", many: "carros", feminine: false }],
    [[], { one: "carro", many: "carros", feminine: false }],
  ])("%j", (types, noun) => {
    expect(vehicleNoun(types)).toEqual(noun);
  });
});

describe("heroBackground", () => {
  it("nunca deja pasar CSS del usuario", () => {
    const css = JSON.stringify(heroBackground("evil;position:fixed", "red;x:y"));
    expect(css).not.toContain("position");
    expect(css).not.toContain("red;");
    expect(css).toContain(DEFAULT_BRAND_COLOR);
  });

  it("ningún estilo aclara el color de marca (ni degradado ni patrones blancos)", () => {
    for (const style of ["SOLID", "GRADIENT", "DOTS", "LINES"]) {
      const css = JSON.stringify(heroBackground(style, DEFAULT_BRAND_COLOR));
      expect(css).not.toContain("white");
      expect(css).not.toMatch(/255 255 255|255, ?255, ?255/);
    }
  });

  it("chip y recuadros del encabezado solo oscurecen: el texto blanco queda ≥ 4.5:1 en los 8 colores", async () => {
    const { BRAND_PRESETS, parseBrandColor, oklchToHex } = await import("@/lib/validation");
    const { HERO_OVERLAY_BLACK_ALPHA } = await import("@/lib/landing");
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    for (const p of BRAND_PRESETS) {
      const hex = oklchToHex(parseBrandColor(p.hex)!.color)!;
      // Composición sRGB del overlay negro sobre el color de marca
      const rgb = [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) * (1 - HERO_OVERLAY_BLACK_ALPHA));
      const L = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
      expect(1.05 / (L + 0.05), p.label).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("los 4 estilos dan fondos distintos", () => {
    const set = new Set(["SOLID", "GRADIENT", "DOTS", "LINES"].map((s) => JSON.stringify(heroBackground(s, DEFAULT_BRAND_COLOR))));
    expect(set.size).toBe(4);
  });
});

describe("mapsLinks", () => {
  it("sin dirección no hay mapas", () => {
    expect(mapsLinks({ name: "T", address: null, city: null, mapsUrl: null })).toBeNull();
  });

  it("usa el link propio de Google Maps si existe y codifica la dirección para Waze", () => {
    const m = mapsLinks({ name: "T", address: "2a Av 3-45, Zona 1", city: "Chimaltenango", mapsUrl: "https://maps.app.goo.gl/abc" });
    expect(m?.google).toBe("https://maps.app.goo.gl/abc");
    expect(m?.waze).toBe(`https://waze.com/ul?q=${encodeURIComponent("2a Av 3-45, Zona 1, Chimaltenango")}&navigate=yes`);
  });

  it("sin link propio busca por nombre y dirección", () => {
    const m = mapsLinks({ name: "T", address: "Zona 1", city: null, mapsUrl: null });
    expect(m?.google).toContain(encodeURIComponent("T, Zona 1"));
  });
});

describe("buildLandingData", () => {
  it("taller sin nada configurado se arma sin fallar", () => {
    const d = buildLandingData(tenant(), 0, NOW);
    expect(d.name).toBe("Taller Mínimo");
    expect(d.status).toBeNull();
    expect(d.services).toEqual([]);
    expect(d.proof).toEqual({ delivered: null, since: null, place: null });
    expect(d.whatsappHref).toBeNull();
    expect(d.maps).toBeNull();
    expect(d.hoursRows).toEqual([]);
  });

  it("ocultar el conteo respeta la casilla, y 0 entregados no se muestra", () => {
    expect(buildLandingData(tenant({ showDeliveredCount: false }), 312, NOW).proof.delivered).toBeNull();
    expect(buildLandingData(tenant(), 0, NOW).proof.delivered).toBeNull();
    expect(buildLandingData(tenant({ foundedYear: 1998, city: "Chimaltenango" }), 312, NOW).proof).toEqual({
      delivered: 312,
      since: 1998,
      place: "Chimaltenango",
    });
  });

  it("sin horario por día muestra el texto viejo", () => {
    const d = buildLandingData(tenant({ schedule: "Lun-Vie 8-18" }), 0, NOW);
    expect(d.legacySchedule).toBe("Lun-Vie 8-18");
    expect(d.hoursRows).toEqual([]);
    expect(d.status).toBeNull();
  });

  it("con horario por día agrupa días iguales y calcula el chip", () => {
    const d = buildLandingData(
      tenant({ schedule: "texto viejo", weeklyHours: JSON.stringify(DEFAULT_WEEKLY_HOURS) }),
      0,
      NOW
    );
    expect(d.legacySchedule).toBeNull();
    expect(d.hoursRows).toEqual([
      { day: "Lun–Vie", text: "8:00 a. m. – 6:00 p. m." },
      { day: "Sáb", text: "8:00 a. m. – 1:00 p. m." },
      { day: "Dom", text: "Cerrado" },
    ]);
    expect(d.status).toEqual({ open: true, label: "Abierto ahora · cierra 6:00 p. m." });
  });

  it("WhatsApp con texto según el vehículo; servicios limpios", () => {
    const d = buildLandingData(
      tenant({ whatsapp: "+502 5512-3456", vehicleTypes: "MOTORCYCLE", services: "Frenos\n\n Afinación \n" }),
      0,
      NOW
    );
    expect(d.noun.one).toBe("moto");
    expect(d.whatsappHref).toBe(
      `https://wa.me/50255123456?text=${encodeURIComponent("Hola, quiero consultar por mi moto.")}`
    );
    expect(d.services).toEqual(["Frenos", "Afinación"]);
    expect(d.vehiclePhrase).toBe("Motos");
  });

  it("estilo de fondo desconocido cae al degradado", () => {
    expect(buildLandingData(tenant({ heroStyle: "NEON" }), 0, NOW).heroStyle).toBe("GRADIENT");
  });
});

describe("siteUrl (metadataBase para la vista previa de WhatsApp)", () => {
  it("usa PUBLIC_URL si es una URL https válida", async () => {
    const { siteUrl } = await import("@/lib/site");
    expect(siteUrl({ PUBLIC_URL: "https://micomercio.app" })?.href).toBe("https://micomercio.app/");
    expect(siteUrl({ PUBLIC_URL: "" })).toBeUndefined();
    expect(siteUrl({ PUBLIC_URL: "no es url" })).toBeUndefined();
    expect(siteUrl({})).toBeUndefined();
  });
});

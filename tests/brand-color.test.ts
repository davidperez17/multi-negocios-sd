import { describe, expect, it } from "vitest";
import { hexToOklch, oklchToHex, parseBrandColor } from "@/lib/validation";

describe("hexToOklch", () => {
  it("convierte colores de referencia", () => {
    expect(hexToOklch("#ffffff")).toBe("oklch(1 0 0)");
    expect(hexToOklch("#000000")).toBe("oklch(0 0 0)");
    // Rojo sRGB puro: oklch(0.628 0.258 29.2) según la especificación de OKLab
    expect(hexToOklch("#ff0000")).toBe("oklch(0.628 0.258 29.2)");
    expect(hexToOklch("#f00")).toBe("oklch(0.628 0.258 29.2)");
  });

  it("rechaza lo que no es hex", () => {
    expect(hexToOklch("azul")).toBeNull();
    expect(hexToOklch("#12345")).toBeNull();
  });
});

describe("oklchToHex", () => {
  it.each(["#a3207f", "#1e6fd9", "#2f855a", "#ffffff", "#000000"])("ida y vuelta %s", (hex) => {
    expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
  });

  it("acepta L en porcentaje y devuelve null si no es oklch", () => {
    expect(oklchToHex("oklch(62.8% 0.258 29.2)")).toBe("#ff0000");
    expect(oklchToHex("red")).toBeNull();
  });
});

describe("parseBrandColor", () => {
  it("acepta hex del selector y lo guarda en OKLCH", () => {
    // Verificado aparte por la ruta sRGB → XYZ → LMS de la especificación
    expect(parseBrandColor("#1e6fd9")).toEqual({ color: "oklch(0.555 0.179 257.4)", adjusted: false });
  });

  it("acepta oklch escrito a mano", () => {
    expect(parseBrandColor(" oklch(0.5 0.16 250) ")).toEqual({ color: "oklch(0.5 0.16 250)", adjusted: false });
  });

  it("oscurece colores tan claros que el texto blanco no se leería", () => {
    const res = parseBrandColor("#ffe14d");
    expect(res?.adjusted).toBe(true);
    expect(Number(res!.color.match(/oklch\(([\d.]+)/)![1])).toBeLessThanOrEqual(0.62);
  });

  it("rechaza nombres y CSS inyectado", () => {
    expect(parseBrandColor("azul")).toBeNull();
    expect(parseBrandColor("red;position:fixed")).toBeNull();
  });
});

describe("BRAND_PRESETS", () => {
  it("ningún color sugerido necesita ajuste de contraste", async () => {
    const { BRAND_PRESETS } = await import("@/lib/validation");
    for (const p of BRAND_PRESETS) expect(parseBrandColor(p.hex)?.adjusted, p.label).toBe(false);
  });
});

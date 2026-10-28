import { describe, expect, it } from "vitest";
import {
  isValidBrandColor,
  normalizePlate,
  parseDateOnly,
  parseMoneyToCents,
  parseQuantity,
  parseYear,
} from "@/lib/validation";
import { formatDate, formatDateTime } from "@/lib/format";

describe("parseMoneyToCents (es-GT: punto decimal, coma de miles)", () => {
  it.each([
    ["1500", 150000],
    ["1,500", 150000],
    ["1,500.00", 150000],
    ["12,345,678.9", 1234567890],
    ["0.05", 5],
    ["10.5", 1050],
    [" 250 ", 25000],
    ["Q 250.00", 25000],
    ["12,5", 1250], // coma decimal (1–2 dígitos) también se acepta
  ])("%s → %i", (raw, cents) => {
    expect(parseMoneyToCents(raw)).toBe(cents);
  });

  it.each(["", "abc", "0", "0.00", "-5", "10.005", "1,50,0", "1.2.3", "1e5"])("rechaza %j", (raw) => {
    expect(parseMoneyToCents(raw)).toBeNull();
  });
});

describe("parseQuantity", () => {
  it("acepta enteros 1..999", () => {
    expect(parseQuantity("3")).toBe(3);
    expect(parseQuantity("")).toBe(1);
  });
  it.each(["0", "2.5", "1000", "abc", "-1"])("rechaza %j", (raw) => {
    expect(parseQuantity(raw)).toBeNull();
  });
});

describe("parseYear", () => {
  it("vacío → null; año válido → número", () => {
    expect(parseYear("")).toBeNull();
    expect(parseYear("2019")).toBe(2019);
  });
  it.each(["19", "abc", "2019.5", "1800", "3000"])("rechaza %j", (raw) => {
    expect(parseYear(raw)).toBe("invalid");
  });
});

describe("normalizePlate", () => {
  it.each([
    ["p-402jkl", "P-402JKL"],
    ["P 402 JKL", "P-402JKL"],
    ["P402JKL", "P-402JKL"],
    ["  m-123abc ", "M-123ABC"],
    ["CD-123ABC", "CD-123ABC"],
    ["ABC123", "ABC123"], // formato extranjero: solo mayúsculas sin espacios
  ])("%j → %s", (raw, plate) => {
    expect(normalizePlate(raw)).toBe(plate);
  });
});

describe("fechas en hora de Guatemala", () => {
  it("parseDateOnly no corre el día", () => {
    const d = parseDateOnly("2026-11-03");
    expect(d).not.toBeNull();
    expect(formatDate(d!)).toContain("3 de noviembre");
  });
  it("parseDateOnly rechaza basura", () => {
    expect(parseDateOnly("")).toBeNull();
    expect(parseDateOnly("2026-13-45")).toBe("invalid");
    expect(parseDateOnly("mañana")).toBe("invalid");
  });
  it("formatDateTime usa America/Guatemala aunque el server esté en UTC", () => {
    // 2026-11-03 18:30 UTC = 12:30 p. m. en Guatemala (UTC-6)
    expect(formatDateTime(new Date("2026-11-03T18:30:00Z"))).toMatch(/12:30/);
  });
});

describe("isValidBrandColor", () => {
  it.each(["oklch(0.5 0.16 250)", "oklch(50% 0.2 340)", "oklch(0.62 0.19 35 / 0.9)"])("acepta %s", (c) => {
    expect(isValidBrandColor(c)).toBe(true);
  });
  it.each([
    "red",
    "rojo",
    "#ff00",
    "oklch(0.5 0.2 340);position:fixed",
    "oklch(0.5 0.2 340) url(https://evil/x.png)",
    "oklch(0.5 0.2)",
    "",
  ])("rechaza %j", (c) => {
    expect(isValidBrandColor(c)).toBe(false);
  });
});

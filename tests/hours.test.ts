import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEEKLY_HOURS,
  formatDayRanges,
  formatTime12,
  openStatus,
  parseWeeklyHours,
  validateWeeklyHours,
  type WeeklyHours,
} from "@/lib/hours";

// Guatemala = UTC−6 todo el año: 10:00 GT = 16:00 UTC
const gt = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h + 6, m));
};
const TUE = "2026-10-27";
const SAT = "2026-10-31";

const weekday: [string, string][] = [
  ["08:00", "12:00"],
  ["14:00", "18:00"],
];
const H: WeeklyHours = { 0: [], 1: weekday, 2: weekday, 3: weekday, 4: weekday, 5: weekday, 6: [["08:00", "13:00"]] };

describe("openStatus", () => {
  it("abierto en la mañana: cierra al mediodía", () => {
    expect(openStatus(H, gt(TUE, "10:00"))).toEqual({ open: true, label: "Abierto ahora · cierra 12:00 p. m." });
  });

  it("a la hora de cierre ya está cerrado (mediodía)", () => {
    expect(openStatus(H, gt(TUE, "12:00"))).toEqual({ open: false, label: "Cerrado al mediodía · abre 2:00 p. m." });
  });

  it("a la hora de apertura ya está abierto", () => {
    expect(openStatus(H, gt(TUE, "14:00"))).toEqual({ open: true, label: "Abierto ahora · cierra 6:00 p. m." });
  });

  it("antes de abrir: abre hoy", () => {
    expect(openStatus(H, gt(TUE, "07:30"))).toEqual({ open: false, label: "Cerrado · abre hoy 8:00 a. m." });
  });

  it("después de cerrar: abre mañana", () => {
    expect(openStatus(H, gt(TUE, "19:00"))).toEqual({ open: false, label: "Cerrado · abre mañana 8:00 a. m." });
  });

  it("sábado en la tarde con domingo cerrado: abre el lunes", () => {
    expect(openStatus(H, gt(SAT, "15:00"))).toEqual({ open: false, label: "Cerrado · abre el lunes 8:00 a. m." });
  });

  it("todos los días cerrados: sin chip", () => {
    const closed: WeeklyHours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    expect(openStatus(closed, gt(TUE, "10:00"))).toBeNull();
  });
});

describe("validateWeeklyHours", () => {
  const base = { ...DEFAULT_WEEKLY_HOURS };

  it.each([
    ["3 tramos", { ...base, 1: [["07:00", "08:00"], ["09:00", "10:00"], ["11:00", "12:00"]] }],
    ["inicio después del fin", { ...base, 1: [["18:00", "08:00"]] }],
    ["traslape", { ...base, 1: [["08:00", "13:00"], ["12:00", "14:00"]] }],
    ["hora sin cero", { ...base, 1: [["8:00", "12:00"]] }],
    ["día 7", { ...base, 7: [] }],
    ["no es objeto", "lunes 8-5"],
  ])("rechaza %s", (_name, h) => {
    expect(validateWeeklyHours(h)).toBeNull();
  });

  it("acepta y ordena dos tramos", () => {
    const res = validateWeeklyHours({ ...base, 1: [["14:00", "18:00"], ["08:00", "12:00"]] });
    expect(res?.[1]).toEqual([
      ["08:00", "12:00"],
      ["14:00", "18:00"],
    ]);
  });
});

describe("parseWeeklyHours", () => {
  it("vacío o roto → null", () => {
    expect(parseWeeklyHours(null)).toBeNull();
    expect(parseWeeklyHours("")).toBeNull();
    expect(parseWeeklyHours("{roto")).toBeNull();
  });

  it("ida y vuelta", () => {
    expect(parseWeeklyHours(JSON.stringify(DEFAULT_WEEKLY_HOURS))).toEqual(DEFAULT_WEEKLY_HOURS);
  });
});

describe("formato", () => {
  it.each([
    ["14:00", "2:00 p. m."],
    ["08:00", "8:00 a. m."],
    ["12:00", "12:00 p. m."],
    ["00:30", "12:30 a. m."],
  ])("formatTime12(%s) → %s", (hhmm, out) => {
    expect(formatTime12(hhmm)).toBe(out);
  });

  it("formatDayRanges", () => {
    expect(formatDayRanges([])).toBe("Cerrado");
    expect(formatDayRanges([["08:00", "18:00"]])).toBe("8:00 a. m. – 6:00 p. m.");
    expect(formatDayRanges(weekday)).toBe("8:00 a. m. – 12:00 p. m. · 2:00 – 6:00 p. m.");
  });
});

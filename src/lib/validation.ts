// Parseo de inputs de formularios del admin. Devuelven null/"invalid" en vez de lanzar,
// para que el server action decida qué error mostrar.

/**
 * Monto en quetzales → centavos, sin flotantes. Formato es-GT: punto decimal y coma de miles
 * ("1,500.00"). También acepta coma decimal con 1–2 dígitos ("12,5"). Rechaza 0 y negativos.
 */
export function parseMoneyToCents(raw: string): number | null {
  let s = raw.trim().replace(/^Q\s*/i, "");
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) s = s.replaceAll(",", "");
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;

  const [int, frac = ""] = s.split(".");
  const cents = Number(int) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

/** Cantidad entera 1..999. Vacío = 1. */
export function parseQuantity(raw: string): number | null {
  const s = raw.trim();
  if (!s) return 1;
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 999 ? n : null;
}

/** Año del vehículo. Vacío = null (opcional). */
export function parseYear(raw: string): number | null | "invalid" {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{4}$/.test(s)) return "invalid";
  const n = Number(s);
  return n >= 1900 && n <= new Date().getFullYear() + 1 ? n : "invalid";
}

/** Placa en formato guatemalteco "P-123ABC" cuando aplica; si no, mayúsculas sin espacios. */
export function normalizePlate(raw: string): string {
  const compact = raw.toUpperCase().replace(/[\s-]+/g, "");
  const gt = compact.match(/^([A-Z]{1,2})(\d{3}[A-Z]{3})$/);
  return gt ? `${gt[1]}-${gt[2]}` : compact;
}

/**
 * Fecha de un <input type="date"> ("2026-11-03"). Se guarda a mediodía de Guatemala
 * para que ningún huso horario la corra de día.
 */
export function parseDateOnly(raw: string): Date | null | "invalid" {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "invalid";
  const d = new Date(`${s}T12:00:00-06:00`);
  if (Number.isNaN(d.getTime())) return "invalid";
  // Rechaza fechas que Date "normaliza" (2026-02-31 → marzo)
  const check = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (check.getUTCMonth() !== +m[2] - 1 || check.getUTCDate() !== +m[3]) return "invalid";
  return d;
}

export const DEFAULT_BRAND_COLOR = "oklch(0.5 0.2 340)";

const OKLCH_RE = /^oklch\(\s*\d*\.?\d+%?\s+\d*\.?\d+\s+\d*\.?\d+(\s*\/\s*\d*\.?\d+%?)?\s*\)$/;

/** Solo oklch(L C H [/ A]): el valor se escribe en atributos style y no puede llevar más CSS. */
export function isValidBrandColor(c: string): boolean {
  return OKLCH_RE.test(c.trim());
}

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

/** brandColor listo para un atributo style; si es inválido, el color por defecto. */
export function safeBrandColor(c: string): string {
  return isValidBrandColor(c) ? c.trim() : DEFAULT_BRAND_COLOR;
}

// ── Cuentas (registro y equipo) ───────────────────────────────────

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** 8+ caracteres; tope de 72 porque bcrypt ignora lo que sigue. */
export function isValidPassword(pw: string): boolean {
  return pw.length >= 8 && new TextEncoder().encode(pw).length <= 72;
}

/** Teléfono de Guatemala (8 dígitos, con o sin +502) → "+502 5512 3456". */
export function normalizeGtPhone(raw: string): string | null {
  let digits = raw.replace(/[\s()+-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 11 && digits.startsWith("502")) digits = digits.slice(3);
  if (digits.length !== 8) return null;
  return `+502 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/** Número para https://wa.me/<n>: solo dígitos con código de país, o null si no hay. */
export function waNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits || null;
}

// ── Color de marca: hex del selector ⇄ OKLCH (OKLab de Björn Ottosson) ──

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const round = (n: number, d: number) => Number(n.toFixed(d));

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(HEX_RE);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklch([r8, g8, b8]: [number, number, number]): [number, number, number] {
  const [r, g, b] = [r8, g8, b8].map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = (Math.atan2(B, A) * 180) / Math.PI;
  return [L, C, H < 0 ? H + 360 : H];
}

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const A = C * Math.cos((H * Math.PI) / 180);
  const B = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => Math.min(1, Math.max(0, fromLinear(c)))) as [number, number, number];
}

function formatOklch(L: number, C: number, H: number): string {
  if (C < 0.0005) return `oklch(${round(L, 3)} 0 0)`;
  return `oklch(${round(L, 3)} ${round(C, 3)} ${round(H, 1)})`;
}

function parseOklch(c: string): [number, number, number] | null {
  const m = c.trim().match(/^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)\s+(\d*\.?\d+)/);
  if (!m) return null;
  return [Number(m[1]) / (m[2] ? 100 : 1), Number(m[3]), Number(m[4])];
}

/** "#ff0000" → "oklch(0.628 0.258 29.2)"; null si no es hex. */
export function hexToOklch(hex: string): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? formatOklch(...rgbToOklch(rgb)) : null;
}

/** "oklch(…)" → "#rrggbb" para el <input type="color">; null si no es oklch. */
export function oklchToHex(color: string): string | null {
  const p = parseOklch(color);
  if (!p) return null;
  return "#" + oklchToRgb(...p).map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}

/** Contraste WCAG del texto blanco sobre el color (botones y pills llevan texto blanco). */
function whiteContrast(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(toLinear);
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

/**
 * Color de marca desde el formulario: hex del selector u oklch escrito a mano → oklch.
 * Si el texto blanco encima no llega a 4.5:1, baja la luminosidad hasta que sí (adjusted).
 */
export function parseBrandColor(raw: string): { color: string; adjusted: boolean } | null {
  const s = raw.trim();
  let lch: [number, number, number] | null;
  if (HEX_RE.test(s)) lch = rgbToOklch(hexToRgb(s)!);
  else if (isValidBrandColor(s)) lch = parseOklch(s);
  else return null;
  if (!lch) return null;

  let [L] = lch;
  const [, C, H] = lch;
  if (whiteContrast(oklchToRgb(L, C, H)) >= 4.5) {
    return { color: HEX_RE.test(s) ? formatOklch(L, C, H) : s, adjusted: false };
  }
  while (L > 0 && whiteContrast(oklchToRgb(L, C, H)) < 4.5) L -= 0.01;
  return { color: formatOklch(Math.max(L, 0), C, H), adjusted: true };
}

/** Colores sugeridos en Ajustes; todos dan ≥ 4.5:1 con texto blanco. */
export const BRAND_PRESETS = [
  { hex: "#a3207f", label: "Ciruela" },
  { hex: "#1e6fd9", label: "Azul" },
  { hex: "#0f766e", label: "Verde azulado" },
  { hex: "#2f7d32", label: "Verde" },
  { hex: "#c53030", label: "Rojo" },
  { hex: "#b45309", label: "Ámbar" },
  { hex: "#6b46c1", label: "Morado" },
  { hex: "#2d3748", label: "Grafito" },
] as const;

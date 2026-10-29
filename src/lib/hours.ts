// Horario semanal del taller con hasta dos tramos por día (cierre al mediodía)
// y el estado "Abierto ahora / Cerrado" en hora de Guatemala. Funciones puras: sirven en servidor y cliente.

export type Range = [open: string, close: string];
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo
export type WeeklyHours = Record<Weekday, Range[]>;

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MAX_RANGES_PER_DAY = 2;

const WEEKDAY_RANGE: Range[] = [["08:00", "18:00"]];
export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  0: [],
  1: WEEKDAY_RANGE,
  2: WEEKDAY_RANGE,
  3: WEEKDAY_RANGE,
  4: WEEKDAY_RANGE,
  5: WEEKDAY_RANGE,
  6: [["08:00", "13:00"]],
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/** Valida y normaliza (tramos ordenados). null si algo no cuadra. */
export function validateWeeklyHours(h: unknown): WeeklyHours | null {
  if (!h || typeof h !== "object" || Array.isArray(h)) return null;
  const keys = Object.keys(h);
  if (keys.length !== 7 || !WEEKDAYS.every((d) => keys.includes(String(d)))) return null;

  const out = {} as WeeklyHours;
  for (const d of WEEKDAYS) {
    const day = (h as Record<string, unknown>)[d];
    if (!Array.isArray(day) || day.length > MAX_RANGES_PER_DAY) return null;
    const ranges: Range[] = [];
    for (const r of day) {
      if (!Array.isArray(r) || r.length !== 2 || !r.every((t) => typeof t === "string" && HHMM.test(t))) return null;
      if (toMinutes(r[0]) >= toMinutes(r[1])) return null;
      ranges.push([r[0], r[1]]);
    }
    ranges.sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]));
    if (ranges.length === 2 && toMinutes(ranges[1][0]) < toMinutes(ranges[0][1])) return null;
    out[d] = ranges;
  }
  return out;
}

export function parseWeeklyHours(json: string | null): WeeklyHours | null {
  if (!json) return null;
  try {
    return validateWeeklyHours(JSON.parse(json));
  } catch {
    return null;
  }
}

function splitTime(hhmm: string): { text: string; period: "a. m." | "p. m." } {
  const h = Number(hhmm.slice(0, 2));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { text: `${h12}:${hhmm.slice(3)}`, period: h < 12 ? "a. m." : "p. m." };
}

/** "14:00" → "2:00 p. m." */
export function formatTime12(hhmm: string): string {
  const t = splitTime(hhmm);
  return `${t.text} ${t.period}`;
}

/** "8:00 a. m. – 12:00 p. m. · 2:00 – 6:00 p. m." (si ambos extremos son del mismo periodo, se dice una vez) */
export function formatDayRanges(ranges: Range[]): string {
  if (ranges.length === 0) return "Cerrado";
  return ranges
    .map(([open, close]) => {
      const a = splitTime(open);
      const b = splitTime(close);
      return a.period === b.period ? `${a.text} – ${b.text} ${b.period}` : `${a.text} ${a.period} – ${b.text} ${b.period}`;
    })
    .join(" · ");
}

const GT_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Guatemala",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const WEEKDAY_INDEX: Record<string, Weekday> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function guatemalaNow(now: Date): { day: Weekday; minutes: number } {
  const parts = Object.fromEntries(GT_PARTS.formatToParts(now).map((p) => [p.type, p.value]));
  return { day: WEEKDAY_INDEX[parts.weekday], minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Estado para el chip de la landing; null si el taller no abre ningún día. */
export function openStatus(h: WeeklyHours, now: Date): { open: boolean; label: string } | null {
  if (WEEKDAYS.every((d) => h[d].length === 0)) return null;
  const { day, minutes } = guatemalaNow(now);
  const today = h[day];

  const current = today.find(([o, c]) => minutes >= toMinutes(o) && minutes < toMinutes(c));
  if (current) return { open: true, label: `Abierto ahora · cierra ${formatTime12(current[1])}` };

  const laterToday = today.find(([o]) => toMinutes(o) > minutes);
  if (laterToday) {
    const hadEarlier = today.some(([, c]) => toMinutes(c) <= minutes);
    const prefix = hadEarlier ? "Cerrado al mediodía · abre" : "Cerrado · abre hoy";
    return { open: false, label: `${prefix} ${formatTime12(laterToday[0])}` };
  }

  for (let i = 1; i <= 7; i++) {
    const d = ((day + i) % 7) as Weekday;
    const first = h[d][0];
    if (!first) continue;
    const when = i === 1 ? "mañana" : `el ${WEEKDAY_NAMES[d]}`;
    return { open: false, label: `Cerrado · abre ${when} ${formatTime12(first[0])}` };
  }
  return null;
}

import { randomInt } from "crypto";

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

// Huso fijo: el server suele correr en UTC y Guatemala no tiene horario de verano
const TIME_ZONE = "America/Guatemala";

const dateTime = new Intl.DateTimeFormat("es-GT", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat("es-GT", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDateTime(d: Date | string): string {
  return dateTime.format(typeof d === "string" ? new Date(d) : d);
}

export function formatDate(d: Date | string): string {
  return dateOnly.format(typeof d === "string" ? new Date(d) : d);
}

const TRACKING_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L

// Códigos con CSPRNG: Math.random es predecible a partir de valores observados
export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += TRACKING_ALPHABET[randomInt(TRACKING_ALPHABET.length)];
  }
  return `TX-${code}`;
}

// PIN numérico de 5 dígitos que protege el apartado de costos
export function generateCostCode(): string {
  return String(randomInt(10000, 100000));
}

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

const dateTime = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat("es-GT", {
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

export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += TRACKING_ALPHABET[Math.floor(Math.random() * TRACKING_ALPHABET.length)];
  }
  return `TX-${code}`;
}

// PIN numérico de 5 dígitos que protege el apartado de costos
export function generateCostCode(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

import type { CSSProperties } from "react";
import type { Tenant } from "@/generated/prisma/client";
import { formatDayRanges, openStatus, parseWeeklyHours, WEEKDAY_SHORT, type Weekday } from "./hours";
import { VEHICLE_TYPE_PLURALS, VEHICLE_TYPES, type VehicleType } from "./status";
import { safeBrandColor, waNumber } from "./validation";

// Datos de la landing pública ya resueltos para pintar. Sin acceso a DB: lo usa también
// la vista previa de Ajustes en el cliente.

export const HERO_STYLES = ["SOLID", "GRADIENT", "DOTS", "LINES"] as const;
export type HeroStyle = (typeof HERO_STYLES)[number];
export const HERO_STYLE_LABELS: Record<HeroStyle, string> = {
  SOLID: "Liso",
  GRADIENT: "Degradado",
  DOTS: "Puntos",
  LINES: "Líneas",
};

export function isHeroStyle(s: string): s is HeroStyle {
  return (HERO_STYLES as readonly string[]).includes(s);
}

/** Fondo del encabezado. Nunca más claro que el color de marca; los patrones son trazos finos de baja opacidad. */
export function heroBackground(style: string, brandColor: string): CSSProperties {
  const c = safeBrandColor(brandColor);
  switch (isHeroStyle(style) ? style : "GRADIENT") {
    case "SOLID":
      return { backgroundColor: c };
    case "DOTS":
      return {
        backgroundColor: c,
        backgroundImage: "radial-gradient(rgb(255 255 255 / 0.12) 1.4px, transparent 1.6px)",
        backgroundSize: "18px 18px",
      };
    case "LINES":
      return {
        backgroundColor: c,
        backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.07) 0 2px, transparent 2px 14px)",
      };
    default:
      return {
        backgroundColor: c,
        // Solo hacia oscuro: el color de marca ya garantiza 4.5:1 con texto blanco
        backgroundImage: `linear-gradient(160deg, ${c} 0%, ${c} 35%, color-mix(in oklch, ${c} 68%, black) 100%)`,
      };
  }
}

export type VehicleNoun = { one: string; many: string; feminine: boolean };

const NOUNS: Record<VehicleType, VehicleNoun> = {
  CAR: { one: "carro", many: "carros", feminine: false },
  MOTORCYCLE: { one: "moto", many: "motos", feminine: true },
  TRUCK: { one: "camión", many: "camiones", feminine: false },
};

/** "carro" salvo talleres de un solo tipo de vehículo (solo motos → "moto"). */
export function vehicleNoun(types: string[]): VehicleNoun {
  const valid = [...new Set(types)].filter((t): t is VehicleType => (VEHICLE_TYPES as readonly string[]).includes(t));
  return valid.length === 1 ? NOUNS[valid[0]] : NOUNS.CAR;
}

/** Código TX-XXXXXX desde lo que el cliente escriba o pegue (link o mensaje completo). */
export function extractTrackingCode(input: string): string | null {
  const s = input.toUpperCase();
  const inText = s.match(/(?:^|[^A-Z0-9])TX-([A-Z0-9]{6})(?![A-Z0-9])/);
  if (inText) return `TX-${inText[1]}`;
  const compact = s.replace(/\s+/g, "").replace(/^TX-?/, "");
  return /^[A-Z0-9]{6}$/.test(compact) ? `TX-${compact}` : null;
}

export function mapsLinks(t: {
  name: string;
  address: string | null;
  city: string | null;
  mapsUrl: string | null;
}): { google: string; waze: string } | null {
  if (!t.address) return null;
  const place = `${t.address}${t.city ? `, ${t.city}` : ""}`;
  return {
    google: t.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(`${t.name}, ${place}`)}`,
    waze: `https://waze.com/ul?q=${encodeURIComponent(place)}&navigate=yes`,
  };
}

export type LandingData = {
  slug: string;
  name: string;
  logoUrl: string | null;
  storefrontPhotoUrl: string | null;
  heroStyle: HeroStyle;
  brandColor: string;
  noun: VehicleNoun;
  tagline: string | null;
  description: string | null;
  services: string[];
  vehiclePhrase: string;
  whatsappHref: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  maps: { google: string; waze: string } | null;
  status: { open: boolean; label: string } | null;
  hoursRows: { day: string; text: string }[];
  legacySchedule: string | null;
  proof: { delivered: number | null; since: number | null; place: string | null };
};

// Lunes primero, como se lee un horario en Guatemala
const WEEK_FROM_MONDAY: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

function hoursRows(json: string | null): { day: string; text: string }[] {
  const h = parseWeeklyHours(json);
  if (!h) return [];
  const rows: { from: Weekday; to: Weekday; text: string }[] = [];
  for (const d of WEEK_FROM_MONDAY) {
    const text = formatDayRanges(h[d]);
    const last = rows.at(-1);
    if (last && last.text === text) last.to = d;
    else rows.push({ from: d, to: d, text });
  }
  return rows.map((r) => ({
    day: r.from === r.to ? WEEKDAY_SHORT[r.from] : `${WEEKDAY_SHORT[r.from]}–${WEEKDAY_SHORT[r.to]}`,
    text: r.text,
  }));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildLandingData(tenant: Tenant, deliveredCount: number, now: Date): LandingData {
  const types = tenant.vehicleTypes
    .split(",")
    .filter((t): t is VehicleType => (VEHICLE_TYPES as readonly string[]).includes(t));
  const noun = vehicleNoun(types);
  const plurals = types.map((t) => VEHICLE_TYPE_PLURALS[t]);
  const vehiclePhrase = capitalize(
    plurals.length > 1 ? `${plurals.slice(0, -1).join(", ")} y ${plurals.at(-1)}` : (plurals[0] ?? "vehículos")
  );
  const wa = waNumber(tenant.whatsapp);
  const weekly = parseWeeklyHours(tenant.weeklyHours);

  return {
    slug: tenant.slug,
    name: tenant.name,
    logoUrl: tenant.logoUrl,
    storefrontPhotoUrl: tenant.storefrontPhotoUrl,
    heroStyle: isHeroStyle(tenant.heroStyle) ? tenant.heroStyle : "GRADIENT",
    brandColor: safeBrandColor(tenant.brandColor),
    noun,
    tagline: tenant.tagline,
    description: tenant.description,
    services: (tenant.services ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    vehiclePhrase,
    whatsappHref: wa
      ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, quiero consultar por mi ${noun.one}.`)}`
      : null,
    phone: tenant.phone,
    address: tenant.address,
    city: tenant.city,
    maps: mapsLinks(tenant),
    status: weekly ? openStatus(weekly, now) : null,
    hoursRows: hoursRows(tenant.weeklyHours),
    legacySchedule: weekly ? null : tenant.schedule,
    proof: {
      delivered: tenant.showDeliveredCount && deliveredCount > 0 ? deliveredCount : null,
      since: tenant.foundedYear,
      place: tenant.city,
    },
  };
}

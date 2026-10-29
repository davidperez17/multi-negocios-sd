import { prisma } from "./prisma";
import { DomainError } from "./orders";
import { validateWeeklyHours } from "./hours";
import { isHeroStyle } from "./landing";
import { deleteTenantUpload, saveTenantImage } from "./uploads";
import { VEHICLE_TYPES } from "./status";
import { isValidEmail, normalizeGtPhone, parseBrandColor, waNumber } from "./validation";

// Ajustes del taller, una función por pestaña: cada una escribe solo sus campos,
// así guardar una pestaña nunca pisa lo de otra. El tenantId viene de la sesión; el rol lo valida el action.

const TEXT_MAX = 2000;
export const MAX_SERVICES = 20;
export const SERVICE_MAX_LENGTH = 60;
const MAPS_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "www.google.com", "google.com", "maps.google.com"]);

const text = (v: string) => v.trim().slice(0, TEXT_MAX) || null;

export type AppearanceInput = {
  name: string;
  tagline: string;
  brandColor: string;
  heroStyle: string;
  foundedYear: string;
  showDeliveredCount: boolean;
  useWeeklyHours: boolean;
  weeklyHours: string;
  logo?: File | null;
  removeLogo: boolean;
  storefront?: File | null;
  removeStorefront: boolean;
};

export async function saveAppearance(
  tenantId: string,
  input: AppearanceInput,
  now = new Date()
): Promise<{ colorAdjusted: boolean }> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) throw new DomainError("invalid_name");
  const color = parseBrandColor(input.brandColor);
  if (!color) throw new DomainError("color");
  if (!isHeroStyle(input.heroStyle)) throw new DomainError("invalid_style");

  let foundedYear: number | null = null;
  const yearRaw = input.foundedYear.trim();
  if (yearRaw) {
    foundedYear = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : NaN;
    if (!(foundedYear >= 1900 && foundedYear <= now.getFullYear())) throw new DomainError("invalid_year");
  }

  // Apagado = sin horario por día: el JSON del editor ni se lee
  let weeklyHours: string | null = null;
  if (input.useWeeklyHours) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.weeklyHours);
    } catch {
      throw new DomainError("invalid_hours");
    }
    const valid = validateWeeklyHours(parsed);
    if (!valid) throw new DomainError("invalid_hours");
    weeklyHours = JSON.stringify(valid);
  }

  const current = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { logoUrl: true, storefrontPhotoUrl: true },
  });

  // Imágenes al final de la validación: si alguna no sirve, no se guarda nada
  const saved: string[] = [];
  const upload = async (file: File | null | undefined, kind: "logo" | "storefront") => {
    if (!file || file.size === 0) return undefined;
    const url = await saveTenantImage(file, tenantId, kind);
    if (!url) {
      await Promise.all(saved.map((u) => deleteTenantUpload(u, tenantId)));
      throw new DomainError("invalid_image");
    }
    saved.push(url);
    return url;
  };
  const newLogo = await upload(input.logo, "logo");
  const newStorefront = await upload(input.storefront, "storefront");

  const logoUrl = newLogo ?? (input.removeLogo ? null : current.logoUrl);
  const storefrontPhotoUrl = newStorefront ?? (input.removeStorefront ? null : current.storefrontPhotoUrl);

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        tagline: text(input.tagline),
        brandColor: color.color,
        heroStyle: input.heroStyle,
        foundedYear,
        showDeliveredCount: input.showDeliveredCount,
        weeklyHours,
        logoUrl,
        storefrontPhotoUrl,
      },
    });
  } catch (e) {
    await Promise.all(saved.map((u) => deleteTenantUpload(u, tenantId)));
    throw e;
  }

  if (current.logoUrl && current.logoUrl !== logoUrl) await deleteTenantUpload(current.logoUrl, tenantId);
  if (current.storefrontPhotoUrl && current.storefrontPhotoUrl !== storefrontPhotoUrl) {
    await deleteTenantUpload(current.storefrontPhotoUrl, tenantId);
  }
  return { colorAdjusted: color.adjusted };
}

export type ContactInput = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  mapsUrl: string;
};

function isGoogleMapsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && MAPS_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

export async function saveContact(tenantId: string, input: ContactInput): Promise<void> {
  let whatsapp: string | null = null;
  if (input.whatsapp.trim()) {
    const phone = normalizeGtPhone(input.whatsapp);
    if (!phone) throw new DomainError("invalid_phone");
    whatsapp = waNumber(phone);
  }
  const email = input.email.trim().toLowerCase();
  if (email && !isValidEmail(email)) throw new DomainError("invalid_email");
  const mapsUrl = input.mapsUrl.trim();
  if (mapsUrl && !isGoogleMapsUrl(mapsUrl)) throw new DomainError("invalid_maps");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      whatsapp,
      phone: text(input.phone),
      email: email || null,
      address: text(input.address),
      city: text(input.city),
      mapsUrl: mapsUrl || null,
    },
  });
}

export type ServicesInput = { services: string[]; vehicleTypes: string[]; description: string };

export async function saveServices(tenantId: string, input: ServicesInput): Promise<void> {
  const seen = new Set<string>();
  const services: string[] = [];
  for (const raw of input.services) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length > SERVICE_MAX_LENGTH) throw new DomainError("invalid_services");
    const key = s.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    services.push(s);
  }
  if (services.length > MAX_SERVICES) throw new DomainError("invalid_services");

  const types = [...new Set(input.vehicleTypes)];
  if (types.length === 0 || !types.every((t) => (VEHICLE_TYPES as readonly string[]).includes(t))) {
    throw new DomainError("invalid_services");
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      services: services.length ? services.join("\n") : null,
      vehicleTypes: types.join(","),
      description: text(input.description),
    },
  });
}

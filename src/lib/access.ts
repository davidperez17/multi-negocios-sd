import { prisma } from "./prisma";

// Acceso al panel según prueba gratis y plan pagado. El seguimiento público no depende de esto:
// los clientes del taller siguen viendo sus carros aunque el plan venza.

export const PLAN_PRICE_LABEL = "Q199/mes + IVA";

export type AccessState = { state: "active" | "trial" | "expired"; daysLeft: number | null };

export function tenantAccess(
  t: { trialEndsAt: Date | null; paidUntil: Date | null },
  now = new Date()
): AccessState {
  if (t.paidUntil && t.paidUntil > now) return { state: "active", daysLeft: null };
  if (t.trialEndsAt && t.trialEndsAt > now) {
    return { state: "trial", daysLeft: Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / 86_400_000) };
  }
  // Sin prueba ni pago registrados: taller dado de alta a mano (demo, clientes previos)
  if (!t.trialEndsAt && !t.paidUntil) return { state: "active", daysLeft: null };
  return { state: "expired", daysLeft: null };
}

/** Registra un pago: suma meses desde el vencimiento vigente o, si ya venció, desde hoy. */
export async function activateTenant(slug: string, months: number, now = new Date()) {
  if (!Number.isInteger(months) || months < 1 || months > 24) throw new Error("Meses debe ser un entero de 1 a 24");
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`No existe un taller con slug "${slug}"`);

  const from = tenant.paidUntil && tenant.paidUntil > now ? tenant.paidUntil : now;
  const paidUntil = new Date(from);
  paidUntil.setUTCMonth(paidUntil.getUTCMonth() + months);
  return prisma.tenant.update({ where: { slug }, data: { paidUntil } });
}

/** WhatsApp de ventas para activar el plan (env SALES_WHATSAPP, solo dígitos con código de país). */
export function salesContactUrl(workshopName: string): string | null {
  const digits = (process.env.SALES_WHATSAPP ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const text = `Hola, quiero activar el plan de TallerLink para ${workshopName}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

import { headers } from "next/headers";
import { prisma } from "./prisma";

// Ventana fija en DB: sirve con un solo proceso o varios contra la misma base.

/** Cuenta un intento para `key`; false si ya pasó de `max` dentro de la ventana. */
export async function hitRateLimit(key: string, max: number, windowMs: number, now = new Date()): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.rateLimit.findUnique({ where: { key } });
    if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return true;
    }
    if (row.count >= max) return false;
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  });
}

/**
 * IP del cliente según el proxy (primer valor de x-forwarded-for), o null si no hay proxy.
 * Sin IP no se limita: una clave compartida bloquearía a todos los visitantes a la vez.
 */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
}

/** hitRateLimit por IP; sin IP conocida siempre permite. */
export async function allowByIp(scope: string, max: number, windowMs: number): Promise<boolean> {
  const ip = await clientIp();
  return ip ? hitRateLimit(`${scope}:${ip}`, max, windowMs) : true;
}

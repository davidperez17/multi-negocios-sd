import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MS = 15 * 60_000;

// Hash de relleno: si el email no existe igual se paga un bcrypt, así el tiempo
// de respuesta no revela qué emails tienen cuenta
const DUMMY_HASH = "$2b$10$xv85o8HQe9b2LhqEIN0No.lJ9YDrDyCibOH1i0KQdrsKspmhQuh6.";

export type AuthResult =
  | { ok: true; user: { id: string; tenantId: string; sessionVersion: number } }
  | { ok: false; reason: "invalid" | "locked" };

export async function authenticate(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Desactivado = como si no existiera (sin revelar que la cuenta existe)
  if (!user || !user.active) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return { ok: false, reason: "locked" };

  if (await bcrypt.compare(password, user.passwordHash)) {
    if (user.failedLogins > 0 || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    }
    return { ok: true, user: { id: user.id, tenantId: user.tenantId, sessionVersion: user.sessionVersion } };
  }

  const { failedLogins } = await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: { increment: 1 } },
    select: { failedLogins: true },
  });
  if (failedLogins >= LOGIN_MAX_FAILURES) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOGIN_LOCK_MS) },
    });
  }
  return { ok: false, reason: "invalid" };
}

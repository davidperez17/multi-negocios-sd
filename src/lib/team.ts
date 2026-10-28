import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { DomainError } from "./orders";
import { isValidEmail, isValidPassword, normalizeEmail } from "./validation";

// Equipo del taller. Solo un ADMIN gestiona usuarios, y siempre dentro de su propio tenant.

export const ROLES = ["ADMIN", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  STAFF: "Trabajador",
};

type Actor = { id: string; tenantId: string; role: string };
type Tx = Prisma.TransactionClient;

function isRole(r: string): r is Role {
  return (ROLES as readonly string[]).includes(r);
}

function requireAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new DomainError("forbidden");
}

async function findMember(tx: Tx, actor: Actor, userId: string) {
  const user = await tx.user.findFirst({ where: { id: userId, tenantId: actor.tenantId } });
  if (!user) throw new DomainError("user_not_found");
  return user;
}

/** Tras el cambio debe quedar al menos un ADMIN activo en el taller. */
async function assertAdminRemains(tx: Tx, tenantId: string) {
  const admins = await tx.user.count({ where: { tenantId, role: "ADMIN", active: true } });
  if (admins === 0) throw new DomainError("last_admin");
}

export async function addWorker(
  actor: Actor,
  input: { name: string; email: string; password: string; role: string }
) {
  requireAdmin(actor);
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (!name || name.length > 80) throw new DomainError("invalid_name");
  if (!isValidEmail(email)) throw new DomainError("invalid_email");
  if (!isValidPassword(input.password)) throw new DomainError("weak_password");
  if (!isRole(input.role)) throw new DomainError("invalid_role");

  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await prisma.user.create({
      data: { tenantId: actor.tenantId, name, email, passwordHash, role: input.role },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new DomainError("email_taken");
    }
    throw e;
  }
}

export async function setWorkerActive(actor: Actor, userId: string, active: boolean) {
  requireAdmin(actor);
  await prisma.$transaction(async (tx) => {
    await findMember(tx, actor, userId);
    await tx.user.update({ where: { id: userId }, data: { active } });
    if (!active) await assertAdminRemains(tx, actor.tenantId);
  });
}

export async function setWorkerRole(actor: Actor, userId: string, role: string) {
  requireAdmin(actor);
  if (!isRole(role)) throw new DomainError("invalid_role");
  await prisma.$transaction(async (tx) => {
    await findMember(tx, actor, userId);
    await tx.user.update({ where: { id: userId }, data: { role } });
    await assertAdminRemains(tx, actor.tenantId);
  });
}

export async function resetWorkerPassword(actor: Actor, userId: string, password: string) {
  requireAdmin(actor);
  if (!isValidPassword(password)) throw new DomainError("weak_password");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    await findMember(tx, actor, userId);
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, failedLogins: 0, lockedUntil: null },
    });
  });
}

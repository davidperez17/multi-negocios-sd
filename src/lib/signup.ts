import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { DomainError } from "./orders";
import { isValidEmail, isValidPassword, normalizeEmail, normalizeGtPhone, waNumber } from "./validation";

// Registro propio de un taller nuevo: crea el tenant, su dueño (ADMIN) y arranca la prueba.

export const TRIAL_DAYS = 30;

export type SignupInput = {
  workshopName: string;
  ownerName: string;
  whatsapp: string;
  email: string;
  password: string;
};

/** "Taller Méndez Hermanos" → "taller-mendez-hermanos" (máx. 40, sin acentos). */
export function slugify(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return s || "taller";
}

function isUniqueViolation(e: unknown, field: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  return JSON.stringify(e.meta ?? {}).includes(field);
}

export async function registerWorkshop(
  input: SignupInput,
  now = new Date()
): Promise<{ tenantId: string; userId: string; slug: string }> {
  const workshopName = input.workshopName.trim();
  const ownerName = input.ownerName.trim();
  const email = normalizeEmail(input.email);
  const phone = normalizeGtPhone(input.whatsapp);
  if (workshopName.length < 2 || workshopName.length > 80) throw new DomainError("invalid_name");
  if (!ownerName || ownerName.length > 80) throw new DomainError("invalid_owner");
  if (!phone) throw new DomainError("invalid_phone");
  if (!isValidEmail(email)) throw new DomainError("invalid_email");
  if (!isValidPassword(input.password)) throw new DomainError("weak_password");

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new DomainError("email_taken");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
  const base = slugify(workshopName);

  // Reintenta si dos registros simultáneos toman el mismo slug
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const taken = await tx.tenant.findMany({
          where: { slug: { startsWith: base } },
          select: { slug: true },
        });
        const used = new Set(taken.map((t) => t.slug));
        let slug = base;
        for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;

        const tenant = await tx.tenant.create({
          data: { slug, name: workshopName, whatsapp: waNumber(phone), phone, email, trialEndsAt },
        });
        const user = await tx.user.create({
          data: { tenantId: tenant.id, name: ownerName, email, passwordHash, role: "ADMIN" },
        });
        await tx.tenant.update({ where: { id: tenant.id }, data: { ownerId: user.id } });
        return { tenantId: tenant.id, userId: user.id, slug };
      });
    } catch (e) {
      if (isUniqueViolation(e, "email")) throw new DomainError("email_taken");
      if (attempt < 2 && isUniqueViolation(e, "slug")) continue;
      throw e;
    }
  }
}

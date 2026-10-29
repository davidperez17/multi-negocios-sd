import { prisma } from "./prisma";

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export { tenantThemeVars } from "./tenant-theme";

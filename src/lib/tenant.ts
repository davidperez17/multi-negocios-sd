import { prisma } from "./prisma";

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

/** Variables CSS que aplican el branding del tenant a su subtree público. */
export function tenantThemeVars(brandColor: string): React.CSSProperties {
  return {
    "--color-primary": brandColor,
    "--color-primary-hover": `color-mix(in oklch, ${brandColor} 88%, black)`,
    "--color-primary-soft": `color-mix(in oklch, ${brandColor} 8%, white)`,
  } as React.CSSProperties;
}

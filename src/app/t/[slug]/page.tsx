import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug, tenantThemeVars } from "@/lib/tenant";
import { buildLandingData, vehicleNoun } from "@/lib/landing";
import { LandingView } from "@/components/landing/LandingView";

// "Abierto ahora" depende de la hora: nunca cachear
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return {};
  const noun = vehicleNoun(tenant.vehicleTypes.split(","));
  const title = `${tenant.name} — ¿Cómo va tu ${noun.one}?`;
  const description = tenant.tagline ?? tenant.description ?? `Consulta el avance de tu ${noun.one} con tu código.`;
  // Vista previa del link al compartirlo por WhatsApp
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: tenant.storefrontPhotoUrl ? [{ url: tenant.storefrontPhotoUrl }] : undefined,
    },
  };
}

export default async function TenantLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const delivered = await prisma.workOrder.count({ where: { tenantId: tenant.id, status: "DELIVERED" } });
  const data = buildLandingData(tenant, delivered, new Date());

  return (
    <div style={tenantThemeVars(tenant.brandColor)} className="flex flex-1 flex-col">
      <LandingView data={data} />
    </div>
  );
}

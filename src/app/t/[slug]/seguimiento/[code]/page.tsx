import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { tenantThemeVars } from "@/lib/tenant";
import { LiveTracking, type TrackingData } from "./LiveTracking";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `Seguimiento ${code.toUpperCase()}`, robots: { index: false } };
}

async function getTracking(slug: string, code: string): Promise<TrackingData | null> {
  const order = await prisma.workOrder.findUnique({
    where: { trackingCode: code.toUpperCase() },
    include: {
      tenant: { select: { slug: true, name: true, phone: true, whatsapp: true, brandColor: true } },
      vehicle: { select: { type: true, brand: true, model: true, year: true, plate: true } },
      customer: { select: { name: true } },
      // Costos protegidos por PIN: aquí solo contamos, el detalle se pide a la API con el PIN
      items: { select: { id: true } },
      updates: { where: { isPublic: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!order || order.tenant.slug !== slug) return null;

  const [first, ...rest] = order.customer.name.split(" ");
  const customerName = rest.length > 0 ? `${first} ${rest[0][0]}.` : first;

  return {
    order: {
      trackingCode: order.trackingCode,
      concern: order.concern,
      diagnosis: order.diagnosis,
      status: order.status,
      estimatedAt: order.estimatedAt?.toISOString() ?? null,
      approvedAt: order.approvedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      updatedAt: order.updatedAt.toISOString(),
    },
    vehicle: order.vehicle,
    customerName,
    costUnlocked: false,
    hasItems: order.items.length > 0,
    items: [],
    updates: order.updates.map((u) => ({
      id: u.id,
      message: u.message,
      status: u.status,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt.toISOString(),
    })),
    tenant: {
      name: order.tenant.name,
      phone: order.tenant.phone,
      whatsapp: order.tenant.whatsapp,
      brandColor: order.tenant.brandColor,
    },
  };
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const data = await getTracking(slug, code);
  if (!data) notFound();

  return (
    <div style={tenantThemeVars(data.tenant.brandColor)} className="flex-1 flex flex-col">
      <header className="bg-primary text-white">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/t/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4"
          >
            <ArrowLeft size={16} aria-hidden />
            {data.tenant.name}
          </Link>
          <span className="inline-flex items-center gap-2 font-mono text-sm tracking-wider">
            <Wrench size={14} aria-hidden />
            {data.order.trackingCode}
          </span>
        </div>
      </header>
      <main className="flex-1">
        <LiveTracking slug={slug} code={code.toUpperCase()} initial={data} />
      </main>
    </div>
  );
}

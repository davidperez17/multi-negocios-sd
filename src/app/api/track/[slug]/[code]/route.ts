import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;
  const pin = new URL(req.url).searchParams.get("pin");

  const order = await prisma.workOrder.findUnique({
    where: { trackingCode: code.toUpperCase() },
    include: {
      tenant: { select: { slug: true, name: true, phone: true, whatsapp: true, brandColor: true } },
      vehicle: { select: { type: true, brand: true, model: true, year: true, plate: true } },
      customer: { select: { name: true } },
      items: { orderBy: { createdAt: "asc" } },
      updates: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.tenant.slug !== slug) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Nombre del cliente abreviado: "Ana Cortés" → "Ana C." (dato público por código)
  const [first, ...rest] = order.customer.name.split(" ");
  const customerName = rest.length > 0 ? `${first} ${rest[0][0]}.` : first;

  // Costos solo con el PIN de 5 dígitos; el resto de la orden es público por trackingCode
  const costUnlocked = pin !== null && pin === order.costCode;

  return NextResponse.json(
    {
      order: {
        trackingCode: order.trackingCode,
        concern: order.concern,
        diagnosis: order.diagnosis,
        status: order.status,
        estimatedAt: order.estimatedAt,
        approvedAt: order.approvedAt,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        updatedAt: order.updatedAt,
      },
      vehicle: order.vehicle,
      customerName,
      costUnlocked,
      hasItems: order.items.length > 0,
      items: costUnlocked
        ? order.items.map((it) => ({
            id: it.id,
            kind: it.kind,
            description: it.description,
            quantity: it.quantity,
            unitCents: it.unitCents,
          }))
        : [],
      updates: order.updates.map((u) => ({
        id: u.id,
        message: u.message,
        status: u.status,
        photoUrl: u.photoUrl,
        createdAt: u.createdAt,
      })),
      tenant: {
        name: order.tenant.name,
        phone: order.tenant.phone,
        whatsapp: order.tenant.whatsapp,
        brandColor: order.tenant.brandColor,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

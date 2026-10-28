import { prisma } from "./prisma";
import { checkCostPin } from "./cost-pin";

// Datos públicos de seguimiento. Los usa la página SSR (sin PIN) y la API de polling.
export type TrackingData = {
  order: {
    trackingCode: string;
    concern: string;
    diagnosis: string | null;
    status: string;
    estimatedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    deliveredAt: string | null;
    updatedAt: string;
  };
  vehicle: { type: string; brand: string; model: string; year: number | null; plate: string };
  customerName: string;
  // Los costos solo llegan con el PIN de 5 dígitos correcto
  costUnlocked: boolean;
  // Demasiados intentos fallidos: el PIN está bloqueado temporalmente
  costLocked: boolean;
  hasItems: boolean;
  items: { id: string; kind: string; description: string; quantity: number; unitCents: number }[];
  updates: { id: string; message: string; status: string; photoUrl: string | null; createdAt: string }[];
  tenant: { name: string; phone: string | null; whatsapp: string | null; brandColor: string };
};

export async function getPublicTracking(args: {
  slug: string;
  code: string;
  pin: string | null;
}): Promise<TrackingData | null> {
  const order = await prisma.workOrder.findUnique({
    where: { trackingCode: args.code.toUpperCase() },
    include: {
      tenant: { select: { slug: true, name: true, phone: true, whatsapp: true, brandColor: true } },
      vehicle: { select: { type: true, brand: true, model: true, year: true, plate: true } },
      customer: { select: { name: true } },
      items: { orderBy: { createdAt: "asc" } },
      updates: { where: { isPublic: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!order || order.tenant.slug !== args.slug) return null;

  // Sin PIN no se cuenta como intento: la página se consulta sin él todo el tiempo
  const pinCheck = args.pin ? await checkCostPin(order, args.pin) : null;
  const costUnlocked = pinCheck === "ok";

  // Nombre del cliente abreviado: "Ana Cortés" → "Ana C." (dato público por código)
  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
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
    costUnlocked,
    costLocked: pinCheck === "locked",
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

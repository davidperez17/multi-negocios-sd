import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// El cliente aprueba el presupuesto. Autorización: el PIN de costos de la orden.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;
  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const order = await prisma.workOrder.findUnique({
    where: { trackingCode: code.toUpperCase() },
    include: {
      tenant: { select: { slug: true } },
      items: { select: { id: true } },
    },
  });

  if (!order || order.tenant.slug !== slug) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!pin || pin !== order.costCode) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 403 });
  }
  if (order.approvedAt) {
    // Idempotente: ya estaba aprobado
    return NextResponse.json({ ok: true, approvedAt: order.approvedAt });
  }
  if (order.status !== "WAITING_APPROVAL" || order.items.length === 0) {
    return NextResponse.json({ error: "not_approvable" }, { status: 409 });
  }

  const approvedAt = new Date();
  await prisma.workOrder.update({
    where: { id: order.id },
    data: {
      approvedAt,
      updates: {
        create: {
          message:
            "Presupuesto aprobado por el cliente desde la página de seguimiento. El taller continuará con la reparación.",
          status: "WAITING_APPROVAL",
        },
      },
    },
  });

  return NextResponse.json({ ok: true, approvedAt });
}

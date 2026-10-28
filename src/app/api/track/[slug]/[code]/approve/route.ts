import { NextResponse } from "next/server";
import { approveBudget } from "@/lib/approval";

export const dynamic = "force-dynamic";

// El cliente aprueba el presupuesto. Autorización: el PIN de costos de la orden.
// `totalCents` es el total que el cliente vio en pantalla; si cambió, responde 409 budget_changed.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;
  let pin = "";
  let totalCents = NaN;
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "");
    totalCents = Number(body?.totalCents);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!Number.isSafeInteger(totalCents)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await approveBudget({ slug, code, pin, totalCents });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, approvedAt: result.approvedAt });
}

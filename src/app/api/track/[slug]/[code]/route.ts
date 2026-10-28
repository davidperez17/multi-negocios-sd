import { NextResponse } from "next/server";
import { getPublicTracking } from "@/lib/tracking";

export const dynamic = "force-dynamic";

// Polling de la página de seguimiento. El PIN de costos viaja en un header
// (no en la URL) para que no quede en logs, historial ni Referer.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;
  const pin = req.headers.get("x-cost-pin");

  const data = await getPublicTracking({ slug, code, pin });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

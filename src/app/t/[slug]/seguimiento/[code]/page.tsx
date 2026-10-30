import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Wrench } from "lucide-react";
import { tenantThemeVars } from "@/lib/tenant";
import { getPublicTracking } from "@/lib/tracking";
import { LiveTracking } from "./LiveTracking";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `Seguimiento ${code.toUpperCase()}`, robots: { index: false } };
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  // Sin PIN: los costos se piden después a la API con el PIN del cliente
  const data = await getPublicTracking({ slug, code, pin: null });
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

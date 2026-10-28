import Link from "next/link";
import { ArrowRight, Wrench, LayoutDashboard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VEHICLE_TYPE_PLURALS, type VehicleType } from "@/lib/status";
import { safeBrandColor } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    select: { slug: true, name: true, tagline: true, city: true, brandColor: true, vehicleTypes: true },
  });

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-12">
        <p className="inline-flex items-center gap-2 font-extrabold text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Wrench size={17} aria-hidden />
          </span>
          TallerLink
        </p>
        <h1 className="mt-8 max-w-2xl text-[clamp(2rem,5.5vw,3.4rem)] font-extrabold leading-[1.08] tracking-tight">
          El taller trabaja. El cliente lo ve.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Plataforma multi-taller para carros, motos y camiones: administra órdenes, costos y clientes,
          y dale a cada cliente seguimiento en tiempo real desde la landing de tu taller.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex h-12 items-center gap-2 rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
          >
            <LayoutDashboard size={18} aria-hidden />
            Entrar al panel del taller
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20">
        <h2 className="text-sm font-semibold text-muted mb-4">Talleres en la plataforma</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {tenants.map((t) => {
            const types = t.vehicleTypes
              .split(",")
              .filter((v): v is VehicleType => Object.hasOwn(VEHICLE_TYPE_PLURALS, v))
              .map((v) => VEHICLE_TYPE_PLURALS[v])
              .join(" · ");
            return (
              <li key={t.slug} className="min-w-0">
                <Link
                  href={`/t/${t.slug}`}
                  className="group flex items-center gap-4 rounded-(--radius-card) border border-border p-5 hover:border-primary transition-colors duration-150"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: safeBrandColor(t.brandColor) }}
                  >
                    <Wrench size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-sm text-muted truncate">
                      {types}
                      {t.city ? ` · ${t.city}` : ""}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    className="ml-auto shrink-0 text-muted group-hover:text-primary transition-colors duration-150"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

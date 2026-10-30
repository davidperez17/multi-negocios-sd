import Link from "next/link";
import { Plus, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { StatusPill } from "@/components/StatusPill";
import { VehicleTypeIcon, vehicleLabel } from "@/components/VehicleTypeIcon";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/status";

export const metadata = { title: "Tablero — TallerLink" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const user = await requireUser();
  const tenantId = user.tenantId;
  const { bienvenida } = await searchParams;

  const [counts, active, teamSize] = await Promise.all([
    prisma.workOrder.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.workOrder.findMany({
      where: { tenantId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: { vehicle: true, customer: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const inShop = ORDER_STATUSES.filter((s) => s !== "DELIVERED").reduce(
    (sum, s) => sum + (countMap[s] ?? 0),
    0
  );

  const totalOrders = counts.reduce((sum, c) => sum + c._count, 0);
  // Primeros pasos del dueño recién registrado; desaparece al completarlos
  const steps = [
    { done: Boolean(user.tenant.address || user.tenant.city), label: "Completa los datos de tu taller", href: "/admin/ajustes" },
    { done: teamSize > 1, label: "Agrega a tu equipo", href: "/admin/equipo" },
    { done: totalOrders > 0, label: "Registra tu primer carro", href: "/admin/ordenes/nueva" },
  ];
  const showSteps = user.role === "ADMIN" && steps.some((s) => !s.done);

  return (
    <>
      {showSteps && (
        <section aria-labelledby="primeros-pasos" className="mb-8 rounded-(--radius-card) border border-border p-5">
          <h2 id="primeros-pasos" className="font-semibold">
            {bienvenida ? `¡Listo, ${user.name.split(" ")[0]}! Tu taller ya está en TallerLink` : "Primeros pasos"}
          </h2>
          <p className="mt-1 text-sm text-muted">Deja listo tu taller en tres pasos.</p>
          <ol className="mt-4 space-y-1">
            {steps.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex items-center gap-3 rounded-(--radius-control) px-2 py-2 -mx-2 hover:bg-surface transition-colors duration-150"
                >
                  {s.done ? (
                    <CheckCircle2 size={20} className="shrink-0 text-status-ready" aria-hidden />
                  ) : (
                    <Circle size={20} className="shrink-0 text-muted" aria-hidden />
                  )}
                  <span className={s.done ? "text-muted line-through" : "font-medium"}>{s.label}</span>
                  <span className="sr-only">{s.done ? "(hecho)" : "(pendiente)"}</span>
                  {!s.done && (
                    <ArrowRight size={16} className="ml-auto shrink-0 text-muted group-hover:text-primary" aria-hidden />
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Tablero</h1>
          <p className="text-sm text-muted mt-0.5">
            {inShop === 0
              ? "No hay vehículos en el taller ahora mismo."
              : `${inShop} vehículo${inShop === 1 ? "" : "s"} en el taller.`}
          </p>
        </div>
        <Link
          href="/admin/ordenes/nueva"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
        >
          <Plus size={16} aria-hidden />
          Nueva orden
        </Link>
      </div>

      {/* Conteo por estado: fila compacta, cada uno filtra la lista */}
      <div className="mt-6 flex flex-wrap gap-2">
        {ORDER_STATUSES.filter((s) => s !== "DELIVERED").map((s) => (
          <Link
            key={s}
            href={`/admin/ordenes?estado=${s}`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-primary transition-colors duration-150"
          >
            <span className="font-semibold [font-variant-numeric:tabular-nums]">{countMap[s] ?? 0}</span>
            <span className="text-muted">{STATUS_LABELS[s]}</span>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="font-semibold">Actividad reciente</h2>
          <Link href="/admin/ordenes" className="text-sm text-primary font-medium hover:underline underline-offset-4">
            Ver todas las órdenes
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="rounded-(--radius-card) border border-dashed border-border p-10 text-center">
            <p className="font-medium">Registra tu primera orden</p>
            <p className="mt-1 text-sm text-muted">
              Cuando recibas un vehículo, créale una orden y comparte el código de seguimiento con tu cliente.
            </p>
            <Link
              href="/admin/ordenes/nueva"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
            >
              <Plus size={16} aria-hidden />
              Nueva orden
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-(--radius-card) border border-border">
            {active.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/ordenes/${o.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 hover:bg-surface transition-colors duration-150"
                >
                  <VehicleTypeIcon type={o.vehicle.type} size={18} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {vehicleLabel(o.vehicle)}
                      <span className="text-muted font-normal"> · {o.vehicle.plate}</span>
                    </p>
                    <p className="text-sm text-muted truncate">
                      {o.customer.name} · {formatDateTime(o.updatedAt)}
                    </p>
                    {/* Móvil: el pill debajo, no aplasta el texto */}
                    <div className="mt-2 sm:hidden">
                      <StatusPill status={o.status} />
                    </div>
                  </div>
                  <span className="hidden sm:block shrink-0">
                    <StatusPill status={o.status} />
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-muted group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

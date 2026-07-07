import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { StatusPill } from "@/components/StatusPill";
import { VehicleTypeIcon, vehicleLabel } from "@/components/VehicleTypeIcon";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/status";

export const metadata = { title: "Órdenes — TallerLink" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const user = await requireUser();
  const { estado } = await searchParams;
  const filter = estado && (ORDER_STATUSES as readonly string[]).includes(estado) ? estado : null;

  const orders = await prisma.workOrder.findMany({
    where: { tenantId: user.tenantId, ...(filter ? { status: filter } : {}) },
    include: { vehicle: true, customer: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Órdenes</h1>
        <Link
          href="/admin/ordenes/nueva"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
        >
          <Plus size={16} aria-hidden />
          Nueva orden
        </Link>
      </div>

      {/* Filtro por estado */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin/ordenes"
          className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors duration-150 ${
            !filter ? "border-primary bg-primary-soft text-primary font-semibold" : "border-border text-muted hover:border-primary"
          }`}
        >
          Todas
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/ordenes?estado=${s}`}
            className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors duration-150 ${
              filter === s
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border text-muted hover:border-primary"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-(--radius-card) border border-dashed border-border p-10 text-center">
          <p className="font-medium">
            {filter ? `No hay órdenes en «${STATUS_LABELS[filter as OrderStatus]}»` : "Aún no hay órdenes"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filter ? "Prueba con otro estado o crea una orden nueva." : "Crea la primera al recibir un vehículo."}
          </p>
        </div>
      ) : (
        <>
          {/* Móvil: cards apiladas */}
          <ul className="mt-6 space-y-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/ordenes/${o.id}`}
                  className="block rounded-(--radius-card) border border-border p-4 hover:border-primary transition-colors duration-150"
                >
                  <p className="flex min-w-0 items-center gap-2 font-medium">
                    <VehicleTypeIcon type={o.vehicle.type} size={16} className="shrink-0 text-muted" />
                    <span className="truncate">{vehicleLabel(o.vehicle)}</span>
                  </p>
                  <p className="mt-1.5 text-sm text-muted truncate">
                    {o.customer.name} · {o.vehicle.plate}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <StatusPill status={o.status} />
                    <span className="text-xs text-muted [font-variant-numeric:tabular-nums]">
                      {formatDateTime(o.updatedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* md+: tabla densa */}
          <div className="mt-6 hidden md:block overflow-x-auto rounded-(--radius-card) border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border bg-surface">
                <th className="px-4 py-2.5 font-medium">Vehículo</th>
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="px-4 py-2.5 font-medium">Código</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Actualizada</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-b-0 hover:bg-surface transition-colors duration-150">
                  <td className="px-4 py-3">
                    <Link href={`/admin/ordenes/${o.id}`} className="flex items-center gap-2.5 font-medium">
                      <VehicleTypeIcon type={o.vehicle.type} size={16} className="shrink-0 text-muted" />
                      {vehicleLabel(o.vehicle)}
                      <span className="text-muted font-normal">{o.vehicle.plate}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.customer.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{o.trackingCode}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap [font-variant-numeric:tabular-nums]">
                    {formatDateTime(o.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}

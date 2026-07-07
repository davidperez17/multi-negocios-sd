import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { VehicleTypeIcon, vehicleLabel } from "@/components/VehicleTypeIcon";
import { createCustomer } from "../../actions";

export const metadata = { title: "Clientes — TallerLink" };

const inputCls =
  "w-full h-10 rounded-(--radius-control) border border-border bg-bg px-3 text-sm placeholder:text-muted";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: { tenantId: user.tenantId },
    include: {
      vehicles: true,
      _count: { select: { workOrders: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <h1 className="text-xl font-bold">Clientes</h1>
      <p className="mt-1 text-sm text-muted">
        {customers.length === 0
          ? "Registra a tus clientes para crear órdenes más rápido."
          : `${customers.length} cliente${customers.length === 1 ? "" : "s"} registrados.`}
      </p>

      <form action={createCustomer} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] max-w-3xl">
        <div>
          <label htmlFor="name" className="sr-only">
            Nombre
          </label>
          <input id="name" name="name" required placeholder="Nombre y apellido *" className={inputCls} />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">
            Teléfono
          </label>
          <input id="phone" name="phone" type="tel" required placeholder="Teléfono *" className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Correo
          </label>
          <input id="email" name="email" type="email" placeholder="Correo (opcional)" className={inputCls} />
        </div>
        <button
          type="submit"
          className="h-10 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
        >
          Agregar
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Nombre y teléfono son obligatorios.
        </p>
      )}

      {customers.length > 0 && (
        <ul className="mt-8 divide-y divide-border rounded-(--radius-card) border border-border">
          {customers.map((c) => (
            <li key={c.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""} · {c._count.workOrders} orden
                  {c._count.workOrders === 1 ? "" : "es"}
                </p>
              </div>
              {c.vehicles.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {c.vehicles.map((v) => (
                    <li key={v.id} className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <VehicleTypeIcon type={v.type} size={14} />
                      {vehicleLabel(v)} · {v.plate}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

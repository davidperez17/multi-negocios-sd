import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NewOrderForm, type CustomerOption } from "./NewOrderForm";

export const metadata = { title: "Nueva orden — TallerLink" };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: { tenantId: user.tenantId },
    include: { vehicles: true },
    orderBy: { name: "asc" },
  });

  const options: CustomerOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicles: c.vehicles.map((v) => ({
      id: v.id,
      label: `${v.brand} ${v.model}${v.year ? ` ${v.year}` : ""}`,
      plate: v.plate,
    })),
  }));

  return (
    <>
      <Link
        href="/admin/ordenes"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors duration-150"
      >
        <ArrowLeft size={15} aria-hidden />
        Órdenes
      </Link>
      <h1 className="mt-3 text-xl font-bold">Nueva orden de servicio</h1>
      <p className="mt-1 text-sm text-muted">
        Al crearla se genera el código de seguimiento para compartir con tu cliente.
      </p>
      <NewOrderForm customers={options} error={error} />
    </>
  );
}

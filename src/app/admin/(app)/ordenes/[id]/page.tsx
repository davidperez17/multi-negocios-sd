import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2, Send, Lock, CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { StatusPill } from "@/components/StatusPill";
import { OrderStepper } from "@/components/OrderStepper";
import { CostTable } from "@/components/CostTable";
import { VehicleTypeIcon, vehicleLabel } from "@/components/VehicleTypeIcon";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABELS, statusIndex, type OrderStatus } from "@/lib/status";
import { setOrderStatus, publishUpdate, addItem, deleteItem, saveDiagnosis } from "../../../actions";
import { CopyLinkButton } from "./CopyLinkButton";

const inputCls =
  "w-full h-10 rounded-(--radius-control) border border-border bg-bg px-3 text-sm placeholder:text-muted";

// Mensajes para ?error=<code> que devuelven los server actions
const ERROR_MESSAGES: Record<string, string> = {
  stale_status: "Otra persona cambió el estado de esta orden. Revisa el estado actual e inténtalo de nuevo.",
  invalid_status: "Estado no válido.",
  invalid_item: "Revisa el concepto: cantidad entera de 1 a 999 y precio mayor a Q0 (ej. 1,500.00).",
  photo: "No se pudo subir la foto. Usa JPG, PNG o WebP de hasta 5 MB. El avance no se publicó.",
  order_not_found: "La orden no existe.",
};

export default async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const order = await prisma.workOrder.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      vehicle: true,
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const trackingUrl = `/t/${user.tenant.slug}/seguimiento/${order.trackingCode}`;
  const currentIdx = statusIndex(order.status);
  const nextStatus =
    currentIdx >= 0 && currentIdx < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[currentIdx + 1] : null;

  return (
    <>
      <Link
        href="/admin/ordenes"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors duration-150"
      >
        <ArrowLeft size={15} aria-hidden />
        Órdenes
      </Link>

      {error && (
        <p role="alert" className="mt-4 rounded-(--radius-control) border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error] ?? "No se pudo completar la acción."}
        </p>
      )}

      {/* Encabezado */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xl font-bold">
            <VehicleTypeIcon type={order.vehicle.type} size={20} className="shrink-0 text-muted" />
            <span className="min-w-0">{vehicleLabel(order.vehicle)}</span>
            <span className="text-muted font-normal text-base whitespace-nowrap">· {order.vehicle.plate}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {order.customer.name} · {order.customer.phone} · Ingresó {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm text-muted">{order.trackingCode}</span>
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-control) border border-border px-3 font-mono text-sm"
            title="Compártelo con el cliente para que vea el detalle de costos"
          >
            <Lock size={13} aria-hidden className="text-muted" />
            PIN costos: {order.costCode}
          </span>
          <CopyLinkButton url={trackingUrl} />
          <Link
            href={trackingUrl}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150"
          >
            <ExternalLink size={15} aria-hidden />
            Vista del cliente
          </Link>
        </div>
      </div>

      {/* Estado + avance */}
      <section className="mt-8 rounded-(--radius-card) border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <StatusPill status={order.status} size="md" />
          <p className="text-sm text-muted">
            Motivo: <span className="text-ink">{order.concern}</span>
          </p>
        </div>
        <OrderStepper status={order.status} />

        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
          <form action={setOrderStatus} className="mt-8 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="fromStatus" value={order.status} />
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1.5">
                Cambiar estado
              </label>
              <select id="status" name="status" defaultValue={nextStatus ?? order.status} className={`${inputCls} sm:w-56`}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} disabled={s === order.status}>
                    {STATUS_LABELS[s]}
                    {s === order.status ? " (actual)" : ""}
                  </option>
                ))}
                <option value="CANCELLED">Cancelar orden</option>
              </select>
            </div>
            <div>
              <label htmlFor="statusMessage" className="block text-sm font-medium mb-1.5">
                Mensaje para el cliente
              </label>
              <input
                id="statusMessage"
                name="message"
                className={inputCls}
                placeholder="Opcional. Si lo dejas vacío usamos un mensaje estándar."
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-(--radius-control) bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
            >
              Actualizar
            </button>
          </form>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Costos */}
        <section className="min-w-0 rounded-(--radius-card) border border-border p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Presupuesto</h2>
            {order.approvedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-ready/10 px-3 py-1 text-xs font-semibold text-status-ready">
                <CircleCheck size={13} aria-hidden />
                Aprobado por el cliente · {formatDateTime(order.approvedAt)}
              </span>
            ) : order.status === "WAITING_APPROVAL" && order.items.length > 0 ? (
              <span className="text-xs font-medium text-muted">
                Esperando aprobación del cliente
              </span>
            ) : null}
          </div>
          <CostTable items={order.items} />
          <form action={addItem} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="description" required placeholder="Concepto (ej. cambio de balatas)" className={`${inputCls} sm:col-span-2`} />
              <select name="kind" className={inputCls} aria-label="Tipo de concepto">
                <option value="LABOR">Mano de obra</option>
                <option value="PART">Repuesto</option>
              </select>
              <div className="flex gap-3">
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  aria-label="Cantidad"
                  className={`${inputCls} w-20`}
                />
                <input
                  name="price"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Precio unit. Q"
                  aria-label="Precio unitario"
                  className={inputCls}
                />
              </div>
            </div>
            <button
              type="submit"
              className="h-10 self-end rounded-(--radius-control) border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Agregar
            </button>
          </form>
          {order.items.length > 0 && (
            <ul className="mt-4 space-y-1">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="truncate">{it.description}</span>
                  <form action={deleteItem}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <button
                      type="submit"
                      aria-label={`Eliminar ${it.description}`}
                      className="p-1.5 rounded hover:text-danger transition-colors duration-150 cursor-pointer"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Diagnóstico + avances */}
        <div className="min-w-0 space-y-8">
          <section className="rounded-(--radius-card) border border-border p-5">
            <h2 className="font-semibold mb-4">Diagnóstico</h2>
            <form action={saveDiagnosis} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea
                name="diagnosis"
                rows={3}
                defaultValue={order.diagnosis ?? ""}
                placeholder="Visible para el cliente en su página de seguimiento."
                className="w-full rounded-(--radius-control) border border-border bg-bg px-3 py-2.5 text-sm placeholder:text-muted"
              />
              <button
                type="submit"
                className="h-9 rounded-(--radius-control) border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer"
              >
                Guardar diagnóstico
              </button>
            </form>
          </section>

          <section className="rounded-(--radius-card) border border-border p-5">
            <h2 className="font-semibold mb-4">Avances publicados</h2>
            <form action={publishUpdate} className="mb-6 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input
                name="message"
                required
                placeholder="Ej. Repuestos recibidos, iniciamos montaje…"
                className={inputCls}
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  aria-label="Foto del avance (opcional)"
                  className="min-w-0 flex-1 text-sm text-muted cursor-pointer file:mr-3 file:h-9 file:cursor-pointer file:rounded-(--radius-control) file:border file:border-border file:bg-bg file:px-3 file:text-sm file:font-medium file:text-ink hover:file:border-primary file:transition-colors file:duration-150"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
                >
                  <Send size={15} aria-hidden />
                  Publicar
                </button>
              </div>
              <p className="text-xs text-muted">
                Foto opcional (JPG, PNG o WebP, máx. 5 MB) — el cliente la verá en su seguimiento.
              </p>
            </form>
            {order.updates.length === 0 ? (
              <p className="text-sm text-muted">Sin avances todavía.</p>
            ) : (
              <ol className="space-y-4">
                {order.updates.map((u) => (
                  <li key={u.id} className="text-sm">
                    <p>{u.message}</p>
                    {u.photoUrl && (
                      <a href={u.photoUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u.photoUrl}
                          alt="Foto del avance"
                          loading="lazy"
                          className="mt-2 h-20 w-20 rounded-(--radius-control) border border-border object-cover"
                        />
                      </a>
                    )}
                    <p className="mt-0.5 text-xs text-muted [font-variant-numeric:tabular-nums]">
                      {formatDateTime(u.createdAt)} · {STATUS_LABELS[u.status as OrderStatus] ?? u.status}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

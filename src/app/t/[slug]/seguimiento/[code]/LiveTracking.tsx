"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Phone, MessageCircle, RefreshCw, Lock, Unlock, CircleCheck, LoaderCircle } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { OrderStepper } from "@/components/OrderStepper";
import { CostTable } from "@/components/CostTable";
import { VehicleTypeIcon, vehicleLabel } from "@/components/VehicleTypeIcon";
import { STATUS_HINTS, type OrderStatus } from "@/lib/status";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";

export type TrackingData = {
  order: {
    trackingCode: string;
    concern: string;
    diagnosis: string | null;
    status: string;
    estimatedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    deliveredAt: string | null;
    updatedAt: string;
  };
  vehicle: { type: string; brand: string; model: string; year: number | null; plate: string };
  customerName: string;
  // Los costos solo llegan con el PIN de 5 dígitos correcto
  costUnlocked: boolean;
  hasItems: boolean;
  items: { id: string; kind: string; description: string; quantity: number; unitCents: number }[];
  updates: { id: string; message: string; status: string; photoUrl: string | null; createdAt: string }[];
  tenant: { name: string; phone: string | null; whatsapp: string | null; brandColor: string };
};

const POLL_MS = 10_000;

export function LiveTracking({ slug, code, initial }: { slug: string; code: string; initial: TrackingData }) {
  const [data, setData] = useState(initial);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const knownIds = useRef(new Set(initial.updates.map((u) => u.id)));
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  // PIN validado por la API; se conserva en sessionStorage para no volver a pedirlo
  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);

  const fetchData = async (activePin: string | null) => {
    const qs = activePin ? `?pin=${activePin}` : "";
    const res = await fetch(`/api/track/${slug}/${code}${qs}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as TrackingData;
  };

  const applyData = (next: TrackingData) => {
    const incoming = next.updates.filter((u) => !knownIds.current.has(u.id));
    if (incoming.length > 0) {
      incoming.forEach((u) => knownIds.current.add(u.id));
      setFreshIds(new Set(incoming.map((u) => u.id)));
    }
    setData(next);
    setLastSync(new Date());
  };

  // Restaura el PIN guardado (misma pestaña) y desbloquea sin pedirlo otra vez
  useEffect(() => {
    const saved = sessionStorage.getItem(`costpin:${code}`);
    if (!saved) return;
    fetchData(saved).then((next) => {
      if (next?.costUnlocked) {
        setPin(saved);
        applyData(next);
      } else {
        sessionStorage.removeItem(`costpin:${code}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const next = await fetchData(pin);
        if (!next || stop) return;
        applyData(next);
      } catch {
        // Red intermitente: el próximo tick reintenta
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, code, pin]);

  // Aprobación de presupuesto: confirmación en 2 pasos
  const [confirmingApproval, setConfirmingApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState(false);

  const approveBudget = async () => {
    if (!pin || approving) return;
    setApproving(true);
    setApproveError(false);
    try {
      const res = await fetch(`/api/track/${slug}/${code}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error();
      const next = await fetchData(pin);
      if (next) applyData(next);
      setConfirmingApproval(false);
    } catch {
      setApproveError(true);
    } finally {
      setApproving(false);
    }
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 5 || pinChecking) return;
    setPinChecking(true);
    setPinError(false);
    try {
      const next = await fetchData(pinInput);
      if (next?.costUnlocked) {
        sessionStorage.setItem(`costpin:${code}`, pinInput);
        setPin(pinInput);
        applyData(next);
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    } finally {
      setPinChecking(false);
    }
  };

  const { order, vehicle, items, updates, tenant } = data;
  const total = items.reduce((sum, it) => sum + it.quantity * it.unitCents, 0);
  const hint = STATUS_HINTS[order.status as OrderStatus] ?? "";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-16">
      {/* Estado actual: lo primero que se entiende en 2 segundos */}
      <section className="pt-8" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={order.status} size="md" />
          {order.estimatedAt && order.status !== "DELIVERED" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <CalendarClock size={15} aria-hidden />
              Entrega estimada: <strong className="text-ink font-medium">{formatDate(order.estimatedAt)}</strong>
            </span>
          )}
        </div>
        <p className="mt-3 text-lg leading-relaxed">{hint}</p>
      </section>

      {/* Vehículo */}
      <section className="mt-8 rounded-(--radius-card) bg-surface p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <VehicleTypeIcon type={vehicle.type} size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold leading-tight">{vehicleLabel(vehicle)}</h2>
            <p className="text-sm text-muted mt-0.5">
              Placa {vehicle.plate} · {data.customerName} · Ingresó {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span className="ml-auto hidden sm:block font-mono text-sm text-muted">{order.trackingCode}</span>
        </div>
        <p className="mt-4 text-sm text-muted">
          <span className="font-medium text-ink">Motivo:</span> {order.concern}
        </p>
        {order.diagnosis && (
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">Diagnóstico:</span> {order.diagnosis}
          </p>
        )}
      </section>

      {/* Recorrido */}
      <section className="mt-10">
        <h2 className="text-lg font-bold mb-6">¿Dónde va tu reparación?</h2>
        <OrderStepper status={order.status} />
      </section>

      {/* Avances */}
      <section className="mt-12">
        <h2 className="text-lg font-bold mb-5">Avances del taller</h2>
        {updates.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no hay avances publicados. Te avisaremos aquí en cuanto haya novedades.
          </p>
        ) : (
          <ol className="relative space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {updates.map((u, i) => (
              <li
                key={u.id}
                className={`relative pl-6 ${freshIds.has(u.id) ? "update-enter" : ""}`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${
                    i === 0 ? "bg-primary" : "bg-border"
                  }`}
                />
                <p className={`leading-relaxed ${i === 0 ? "font-medium" : ""}`}>{u.message}</p>
                {u.photoUrl && (
                  <a
                    href={u.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver foto del avance en tamaño completo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.photoUrl}
                      alt={`Foto del avance: ${u.message.slice(0, 80)}`}
                      loading="lazy"
                      className="mt-2.5 w-full max-w-sm rounded-(--radius-card) border border-border object-cover"
                    />
                  </a>
                )}
                <p className="mt-1.5 text-xs text-muted [font-variant-numeric:tabular-nums]">
                  {formatDateTime(u.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Costos: protegidos por PIN de 5 dígitos */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            {data.costUnlocked ? <Unlock size={16} aria-hidden /> : <Lock size={16} aria-hidden />}
            Costos
          </h2>
          {data.costUnlocked && items.length > 0 && (
            <p className="text-sm text-muted">
              Total: <strong className="text-ink text-base [font-variant-numeric:tabular-nums]">{formatCents(total)}</strong>
            </p>
          )}
        </div>
        {data.costUnlocked ? (
          <>
            <CostTable
              items={items}
              emptyText="El presupuesto aparecerá aquí en cuanto el taller registre los conceptos."
            />

            {/* Aprobado: constancia con fecha */}
            {order.approvedAt && (
              <p className="mt-4 flex items-start gap-2.5 rounded-(--radius-card) bg-status-ready/10 p-4 text-sm leading-relaxed">
                <CircleCheck size={18} className="mt-0.5 shrink-0 text-status-ready" aria-hidden />
                <span>
                  Presupuesto <strong>aprobado</strong> el {formatDateTime(order.approvedAt)}.
                </span>
              </p>
            )}

            {/* Pendiente de aprobación: acción principal del cliente */}
            {!order.approvedAt && order.status === "WAITING_APPROVAL" && items.length > 0 && (
              <div className="mt-5 rounded-(--radius-card) bg-primary-soft p-5">
                <p className="font-semibold">El taller espera tu aprobación</p>
                <p className="mt-1 text-sm text-muted leading-relaxed">
                  Al aprobar autorizas el trabajo por <strong className="text-ink">{formatCents(total)}</strong>.
                  Si tienes dudas, contacta al taller antes.
                </p>
                {!confirmingApproval ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingApproval(true)}
                    className="mt-4 h-12 w-full sm:w-auto rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
                  >
                    Aprobar presupuesto
                  </button>
                ) : (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={approveBudget}
                      disabled={approving}
                      className="h-12 inline-flex items-center justify-center gap-2 rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150 disabled:opacity-60 cursor-pointer"
                    >
                      {approving ? (
                        <LoaderCircle size={17} className="animate-spin" aria-hidden />
                      ) : (
                        <CircleCheck size={17} aria-hidden />
                      )}
                      Sí, apruebo {formatCents(total)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingApproval(false)}
                      disabled={approving}
                      className="h-12 rounded-(--radius-control) border border-border px-6 font-medium text-muted hover:text-ink hover:border-primary transition-colors duration-150 cursor-pointer"
                    >
                      Todavía no
                    </button>
                  </div>
                )}
                {approveError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    No pudimos registrar tu aprobación. Intenta de nuevo o contacta al taller.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-(--radius-card) bg-surface p-5">
            <p className="text-sm text-muted leading-relaxed">
              {data.hasItems
                ? order.status === "WAITING_APPROVAL"
                  ? "El taller espera tu aprobación del presupuesto. Ingresa el código de 5 dígitos que te dio el taller para verlo y aprobarlo."
                  : "El detalle de costos está protegido. Ingresa el código de 5 dígitos que te dio el taller."
                : "El presupuesto aparecerá aquí en cuanto el taller registre los conceptos. Para verlo necesitarás el código de 5 dígitos que te da el taller."}
            </p>
            {data.hasItems && (
              <form onSubmit={submitPin} className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ""));
                    setPinError(false);
                  }}
                  placeholder="•••••"
                  aria-label="Código de costos de 5 dígitos"
                  className="h-11 w-32 rounded-(--radius-control) border border-border bg-bg px-3.5 text-center font-mono text-lg tracking-[0.3em] placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={pinInput.length !== 5 || pinChecking}
                  className="h-11 rounded-(--radius-control) bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {pinChecking ? "Verificando…" : "Ver costos"}
                </button>
                {pinError && (
                  <p role="alert" className="w-full text-sm text-danger">
                    Código incorrecto. Verifícalo con el taller.
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </section>

      {/* Contacto */}
      {(tenant.whatsapp || tenant.phone) && (
        <section className="mt-12 rounded-(--radius-card) bg-primary-soft p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="font-medium">¿Tienes dudas sobre tu orden?</p>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            {tenant.whatsapp && (
              <a
                href={`https://wa.me/${tenant.whatsapp}?text=Hola,%20consulto%20por%20mi%20orden%20${order.trackingCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-(--radius-control) bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
              >
                <MessageCircle size={16} aria-hidden />
                WhatsApp
              </a>
            )}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 items-center gap-2 rounded-(--radius-control) border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors duration-150"
              >
                <Phone size={16} aria-hidden />
                Llamar
              </a>
            )}
          </div>
        </section>
      )}

      <p className="mt-8 flex items-center gap-1.5 text-xs text-muted">
        <RefreshCw size={12} aria-hidden />
        Se actualiza solo cada 10 segundos
        {lastSync && ` · última sincronización ${formatDateTime(lastSync)}`}
      </p>
    </div>
  );
}

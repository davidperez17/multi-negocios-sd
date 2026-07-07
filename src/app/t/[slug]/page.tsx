import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Phone,
  MapPin,
  Clock,
  Wrench,
  MessageCircle,
  Check,
  ClipboardList,
  Ticket,
  Radar,
} from "lucide-react";
import { getTenantBySlug, tenantThemeVars } from "@/lib/tenant";
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_PLURALS,
  VEHICLE_TYPE_READY,
  type VehicleType,
} from "@/lib/status";
import { TrackingSearch } from "./TrackingSearch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return {};
  return {
    title: `${tenant.name} — Consulta tu vehículo en línea`,
    description: tenant.description ?? tenant.tagline ?? undefined,
  };
}

export default async function TenantLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const services = (tenant.services ?? "").split("\n").filter(Boolean);
  const types = tenant.vehicleTypes
    .split(",")
    .filter((t): t is VehicleType => t in VEHICLE_TYPE_LABELS);
  const vehicleWords = types.map((t) => VEHICLE_TYPE_LABELS[t].toLowerCase());
  const plurals = types.map((t) => VEHICLE_TYPE_PLURALS[t]);
  const vehiclePhrase =
    plurals.length > 1
      ? `${plurals.slice(0, -1).join(", ")} y ${plurals.at(-1)}`
      : (plurals[0] ?? "vehículos");
  const mapsUrl =
    tenant.address &&
    `https://maps.google.com/?q=${encodeURIComponent(
      `${tenant.name}, ${tenant.address}${tenant.city ? `, ${tenant.city}` : ""}`
    )}`;

  const steps = [
    {
      icon: ClipboardList,
      title: "Deja tu vehículo",
      body: `Recibimos ${vehiclePhrase} y abrimos tu orden al momento.`,
    },
    {
      icon: Ticket,
      title: "Guarda tu código",
      body: "Te damos un código único, por ejemplo TX-ABC123.",
    },
    {
      icon: Radar,
      title: "Síguelo en vivo",
      body: "Avances con fotos, costos claros y aviso cuando esté listo.",
    },
  ];

  return (
    <div style={tenantThemeVars(tenant.brandColor)} className="flex-1 flex flex-col bg-bg">
      {/* Hero soft glass: gradiente del color del tenant + blobs de luz */}
      <div
        className="relative isolate overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(150deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 55%, white) 100%)",
        }}
      >
        {/* Blobs de luz, estáticos y decorativos */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/25 blur-3xl" />
          <span className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <span className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        </div>

        <header>
          <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2.5 font-extrabold text-lg leading-none">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                <Wrench size={18} aria-hidden />
              </span>
              <span className="truncate">{tenant.name}</span>
            </p>
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone.replace(/\s/g, "")}`}
                aria-label={`Llamar al ${tenant.phone}`}
                className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white/15 px-4 -mr-1 text-sm font-semibold ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/25 transition-colors duration-150"
              >
                <Phone size={16} aria-hidden />
                <span className="hidden sm:inline">{tenant.phone}</span>
              </a>
            )}
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 pt-10 pb-20 sm:pt-16 sm:pb-24 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div>
            <p
              className="hero-enter inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium ring-1 ring-white/30 backdrop-blur-sm"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white" />
              Seguimiento en vivo, sin llamar
            </p>
            <h1
              className="hero-enter mt-6 max-w-2xl text-balance text-[clamp(2.1rem,7vw,3.9rem)] font-extrabold leading-[1.05] tracking-tight drop-shadow-sm"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Tu {vehicleWords[0] ?? "vehículo"} avisa cuando está{" "}
              {types[0] ? VEHICLE_TYPE_READY[types[0]] : "listo"}.
            </h1>
            <p
              className="hero-enter mt-5 max-w-xl text-base sm:text-lg text-white/90 leading-relaxed"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {tenant.tagline ? `${tenant.tagline}. ` : ""}
              Mira avances con fotos, costos y fecha de entrega desde tu celular.
            </p>
          </div>

          {/* Tarjeta glass de consulta */}
          <div
            className="hero-enter mt-10 lg:mt-0 max-w-xl"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <div className="rounded-3xl bg-white/70 p-6 sm:p-7 text-ink shadow-2xl shadow-black/15 ring-1 ring-white/60 backdrop-blur-xl">
              <h2 className="text-xl font-extrabold tracking-tight">Consulta tu reparación</h2>
              <div className="mt-5">
                <TrackingSearch slug={tenant.slug} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Cómo funciona: blanco aireado */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
        <h2 className="text-balance text-[1.75rem] sm:text-3xl font-extrabold tracking-tight">
          Así de simple
        </h2>
        <ol className="mt-10 grid gap-10 sm:mt-14 sm:grid-cols-3 sm:gap-12">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-5 sm:block">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25 sm:mb-6"
                style={{
                  background:
                    "linear-gradient(140deg, var(--color-primary), color-mix(in oklch, var(--color-primary) 60%, white))",
                }}
              >
                <step.icon size={24} aria-hidden />
              </span>
              <div className="min-w-0 pt-1.5 sm:pt-0">
                <h3 className="text-lg font-bold">
                  <span className="text-primary">{i + 1}.</span> {step.title}
                </h3>
                <p className="mt-2 text-muted leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Servicios: píldoras suaves */}
      {services.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:pb-28">
          <div className="rounded-3xl bg-gradient-to-br from-primary-soft to-bg p-7 sm:p-12 ring-1 ring-border">
            <h2 className="text-balance text-[1.75rem] sm:text-3xl font-extrabold tracking-tight">
              Servicios
            </h2>
            <p className="mt-2 text-muted">Atendemos {vehiclePhrase}.</p>
            <ul className="mt-7 flex flex-wrap gap-3">
              {services.map((s) => (
                <li
                  key={s}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white/80 px-5 py-3 text-sm font-medium shadow-sm ring-1 ring-white backdrop-blur-sm"
                >
                  <Check size={15} className="shrink-0 text-primary" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Visítanos */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-balance text-[1.75rem] sm:text-3xl font-extrabold tracking-tight">
              Visítanos
            </h2>
            <ul className="mt-7 space-y-2">
              {tenant.address && mapsUrl && (
                <li>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 rounded-2xl py-3 -mx-3 px-3 hover:bg-surface transition-colors duration-150"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <MapPin size={19} aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-ink font-medium group-hover:underline underline-offset-4">
                        {tenant.address}
                        {tenant.city ? `, ${tenant.city}` : ""}
                      </span>
                      <span className="block text-sm text-muted mt-0.5">Ver en el mapa</span>
                    </span>
                  </a>
                </li>
              )}
              {tenant.schedule && (
                <li className="flex items-start gap-4 py-3 -mx-3 px-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Clock size={19} aria-hidden />
                  </span>
                  <span className="pt-2.5 text-ink font-medium">{tenant.schedule}</span>
                </li>
              )}
              {tenant.phone && (
                <li>
                  <a
                    href={`tel:${tenant.phone.replace(/\s/g, "")}`}
                    className="group flex items-start gap-4 rounded-2xl py-3 -mx-3 px-3 hover:bg-surface transition-colors duration-150"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Phone size={19} aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-ink font-medium group-hover:underline underline-offset-4">
                        {tenant.phone}
                      </span>
                      <span className="block text-sm text-muted mt-0.5">Llámanos</span>
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </div>
          {tenant.whatsapp && (
            <a
              href={`https://wa.me/${tenant.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full lg:w-auto items-center justify-center gap-2.5 h-14 px-8 rounded-full text-white font-semibold shadow-xl shadow-primary/30 hover:opacity-90 transition-opacity duration-150"
              style={{
                background:
                  "linear-gradient(140deg, var(--color-primary), color-mix(in oklch, var(--color-primary) 65%, white))",
              }}
            >
              <MessageCircle size={18} aria-hidden />
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </section>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-7 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>© {new Date().getFullYear()} {tenant.name}</span>
          <span>
            Impulsado por <span className="font-semibold text-ink">TallerLink</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

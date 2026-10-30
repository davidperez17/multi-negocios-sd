import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "@/lib/status";
import { oklchToHex, safeBrandColor } from "@/lib/validation";
import { saveContactAction, saveServicesAction } from "../../actions";
import { AppearanceForm } from "./AppearanceForm";
import { ServicesEditor } from "./ServicesEditor";
import { SaveBar } from "./SaveBar";

export const metadata = { title: "Ajustes — TallerLink" };

const inputCls = "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";

const TABS = [
  { id: "pagina", label: "Mi página" },
  { id: "contacto", label: "Contacto" },
  { id: "servicios", label: "Servicios" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ERROR_MESSAGES: Record<string, string> = {
  role: "Solo el administrador puede guardar cambios.",
  invalid_name: "El nombre del taller debe tener de 2 a 80 caracteres.",
  color: "No reconocimos ese color. Elige uno de la lista o con “Otro color”.",
  invalid_style: "Elige uno de los fondos del encabezado.",
  invalid_year: "El año de apertura debe ser un año de 4 dígitos, entre 1900 y este año.",
  invalid_hours: "Revisa el horario: cada tramo debe abrir antes de cerrar y la tarde empezar después de la mañana.",
  invalid_image: "Esa imagen no se pudo usar. Sube un JPG, PNG o WebP (logo hasta 2 MB, foto hasta 5 MB).",
  invalid_phone: "El WhatsApp debe tener 8 dígitos, por ejemplo 5512 3456.",
  invalid_email: "Revisa el correo, parece incompleto.",
  invalid_maps: "Pega el link de Google Maps tal como lo da el botón Compartir (empieza con https://maps.app.goo.gl/).",
  invalid_services: "Elige al menos un tipo de vehículo y usa hasta 20 servicios de 60 caracteres.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string; ajustado?: string }>;
}) {
  const user = await requireUser();
  const t = user.tenant;
  const params = await searchParams;
  const tab: Tab = TABS.some((x) => x.id === params.tab) ? (params.tab as Tab) : "pagina";
  const isAdmin = user.role === "ADMIN";
  const activeTypes = new Set(t.vehicleTypes.split(","));
  const delivered =
    tab === "pagina" ? await prisma.workOrder.count({ where: { tenantId: t.id, status: "DELIVERED" } }) : 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Ajustes del taller</h1>
          <p className="mt-1 text-sm text-muted">Lo que ven tus clientes en tu página y en el seguimiento de su vehículo.</p>
        </div>
        <Link
          href={`/t/${t.slug}`}
          target="_blank"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150"
        >
          <ExternalLink size={15} aria-hidden />
          Ver mi página
        </Link>
      </div>

      <nav aria-label="Secciones de ajustes" className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/ajustes?tab=${x.id}`}
            aria-current={tab === x.id ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
              tab === x.id ? "bg-primary text-white" : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </nav>

      {!isAdmin && (
        <p className="mt-6 rounded-(--radius-card) bg-surface p-4 text-sm text-muted">
          Solo el administrador del taller puede modificar estos datos.
        </p>
      )}
      {params.saved && (
        <p role="status" className="mt-6 rounded-(--radius-card) bg-primary-soft p-3.5 text-sm font-medium">
          Cambios guardados. Tu página ya muestra la información nueva.
          {params.ajustado && " Oscurecimos un poco el color para que el texto blanco se lea bien."}
        </p>
      )}
      {params.error && (
        <p role="alert" className="mt-6 rounded-(--radius-card) border border-danger p-3.5 text-sm text-danger">
          {ERROR_MESSAGES[params.error] ?? "No se pudieron guardar los cambios."} No se guardó nada.
        </p>
      )}

      {tab === "pagina" && (
        <AppearanceForm
          tenant={t}
          initialHex={oklchToHex(safeBrandColor(t.brandColor)) ?? "#a3207f"}
          deliveredCount={delivered}
          isAdmin={isAdmin}
        />
      )}

      {tab === "contacto" && (
        <form action={saveContactAction} className="mt-6 max-w-2xl">
          <fieldset disabled={!isAdmin} className="space-y-5 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="whatsapp" className={labelCls}>
                  WhatsApp del taller
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="5512 3456"
                  defaultValue={t.whatsapp ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelCls}>
                  Teléfono
                </label>
                <input id="phone" name="phone" type="tel" defaultValue={t.phone ?? ""} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelCls}>
                  Correo
                </label>
                <input id="email" name="email" type="email" defaultValue={t.email ?? ""} className={inputCls} />
              </div>
              <div>
                <label htmlFor="address" className={labelCls}>
                  Dirección
                </label>
                <input id="address" name="address" defaultValue={t.address ?? ""} className={inputCls} />
              </div>
              <div>
                <label htmlFor="city" className={labelCls}>
                  Ciudad o municipio
                </label>
                <input
                  id="city"
                  name="city"
                  placeholder="Chimaltenango"
                  defaultValue={t.city ?? ""}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="mapsUrl" className={labelCls}>
                  Link de Google Maps (opcional)
                </label>
                <input
                  id="mapsUrl"
                  name="mapsUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://maps.app.goo.gl/…"
                  aria-describedby="maps-help"
                  defaultValue={t.mapsUrl ?? ""}
                  className={inputCls}
                />
                <p id="maps-help" className="mt-1.5 text-sm text-muted">
                  En Google Maps busca tu taller, toca Compartir y pega aquí el link. Si lo dejas vacío, buscamos tu dirección.
                </p>
              </div>
            </div>
            <SaveBar hint="Se ve en tu página y en el seguimiento." />
          </fieldset>
        </form>
      )}

      {tab === "servicios" && (
        <form action={saveServicesAction} className="mt-6 max-w-2xl">
          <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-60">
            <ServicesEditor initial={(t.services ?? "").split("\n").map((s) => s.trim()).filter(Boolean)} />
            <fieldset>
              <legend className={labelCls}>Vehículos que atiendes</legend>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((vt) => (
                  <label
                    key={vt}
                    className="inline-flex h-11 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm cursor-pointer has-[:checked]:border-primary"
                  >
                    <input
                      type="checkbox"
                      name="vehicleTypes"
                      value={vt}
                      defaultChecked={activeTypes.has(vt)}
                      className="h-4 w-4 accent-(--color-primary)"
                    />
                    {VEHICLE_TYPE_LABELS[vt]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="description" className={labelCls}>
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={t.description ?? ""}
                placeholder="Especialistas en motor y suspensión. Repuestos originales."
                className="w-full rounded-(--radius-control) border border-border bg-bg px-3.5 py-2.5 placeholder:text-muted"
              />
            </div>
            <SaveBar hint="Se ve en la sección “Lo que hacemos”." />
          </fieldset>
        </form>
      )}
    </>
  );
}

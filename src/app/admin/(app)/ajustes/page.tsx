import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "@/lib/status";
import { updateTenantSettings } from "../../actions";
import { safeBrandColor } from "@/lib/validation";

export const metadata = { title: "Ajustes — TallerLink" };

const inputCls =
  "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const t = user.tenant;
  const { saved, error } = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const activeTypes = new Set(t.vehicleTypes.split(","));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Ajustes del taller</h1>
          <p className="mt-1 text-sm text-muted">
            Esta información aparece en tu landing pública y en la página de seguimiento.
          </p>
        </div>
        <Link
          href={`/t/${t.slug}`}
          target="_blank"
          className="inline-flex h-9 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150"
        >
          <ExternalLink size={15} aria-hidden />
          Ver landing
        </Link>
      </div>

      {!isAdmin && (
        <p className="mt-6 rounded-(--radius-card) bg-surface p-4 text-sm text-muted">
          Solo el administrador del taller puede modificar estos datos.
        </p>
      )}

      <form action={updateTenantSettings} className="mt-8 max-w-2xl space-y-6">
        <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelCls}>
                Nombre del taller
              </label>
              <input id="name" name="name" required defaultValue={t.name} className={inputCls} />
            </div>
            <div>
              <label htmlFor="tagline" className={labelCls}>
                Lema
              </label>
              <input id="tagline" name="tagline" defaultValue={t.tagline ?? ""} className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelCls}>
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={t.description ?? ""}
              className="w-full rounded-(--radius-control) border border-border bg-bg px-3.5 py-2.5 placeholder:text-muted"
            />
          </div>

          <fieldset>
            <legend className={labelCls}>Tipos de vehículo que atiendes</legend>
            <div className="flex flex-wrap gap-4">
              {VEHICLE_TYPES.map((vt) => (
                <label key={vt} className="inline-flex items-center gap-2 text-sm cursor-pointer">
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
            <label htmlFor="services" className={labelCls}>
              Servicios (uno por línea)
            </label>
            <textarea
              id="services"
              name="services"
              rows={5}
              defaultValue={t.services ?? ""}
              className="w-full rounded-(--radius-control) border border-border bg-bg px-3.5 py-2.5 placeholder:text-muted font-mono text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelCls}>
                Teléfono
              </label>
              <input id="phone" name="phone" type="tel" defaultValue={t.phone ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="whatsapp" className={labelCls}>
                WhatsApp (con código de país, solo dígitos)
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                inputMode="numeric"
                defaultValue={t.whatsapp ?? ""}
                placeholder="5215512345678"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                Correo
              </label>
              <input id="email" name="email" type="email" defaultValue={t.email ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="schedule" className={labelCls}>
                Horario
              </label>
              <input
                id="schedule"
                name="schedule"
                defaultValue={t.schedule ?? ""}
                placeholder="Lun–Vie 8:00–18:00"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="address" className={labelCls}>
                Dirección
              </label>
              <input id="address" name="address" defaultValue={t.address ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="city" className={labelCls}>
                Ciudad
              </label>
              <input id="city" name="city" defaultValue={t.city ?? ""} className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="brandColor" className={labelCls}>
              Color de marca (OKLCH)
            </label>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-11 w-11 shrink-0 rounded-(--radius-control) border border-border"
                style={{ background: safeBrandColor(t.brandColor) }}
              />
              <input
                id="brandColor"
                name="brandColor"
                defaultValue={t.brandColor}
                placeholder="oklch(0.5 0.2 340)"
                className={`${inputCls} font-mono text-sm`}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Da identidad a tu landing y a la página de seguimiento de tus clientes.
            </p>
          </div>

          {saved && (
            <p role="status" className="text-sm font-medium text-status-ready">
              Cambios guardados. Tu landing ya muestra la información nueva.
            </p>
          )}
          {error === "role" && (
            <p role="alert" className="text-sm text-danger">
              Solo el administrador puede guardar cambios.
            </p>
          )}
          {error === "color" && (
            <p role="alert" className="text-sm text-danger">
              El color debe tener formato OKLCH, por ejemplo oklch(0.5 0.16 250). No se guardaron los cambios.
            </p>
          )}

          <button
            type="submit"
            className="h-11 rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
          >
            Guardar cambios
          </button>
        </fieldset>
      </form>
    </>
  );
}

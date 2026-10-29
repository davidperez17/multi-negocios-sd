"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Eye, X } from "lucide-react";
import type { Tenant } from "@/generated/prisma/client";
import { saveAppearanceAction } from "../../actions";
import { LandingView } from "@/components/landing/LandingView";
import { buildLandingData, heroBackground, HERO_STYLE_LABELS, HERO_STYLES, type HeroStyle, isHeroStyle } from "@/lib/landing";
import { DEFAULT_WEEKLY_HOURS, parseWeeklyHours, type WeeklyHours } from "@/lib/hours";
import { hexToOklch } from "@/lib/validation";
import { tenantThemeVars } from "@/lib/tenant-theme";
import { BrandColorPicker } from "./BrandColorPicker";
import { HoursEditor } from "./HoursEditor";
import { ImageField } from "./ImageField";
import { SaveBar } from "./SaveBar";

const inputCls = "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";
const cardCls = "rounded-(--radius-card) border border-border p-4 sm:p-5";

// Pestaña "Mi página": cómo se ve la landing, con vista previa que cambia mientras se edita (sin guardar).
export function AppearanceForm({
  tenant,
  initialHex,
  deliveredCount,
  isAdmin,
}: {
  tenant: Tenant;
  initialHex: string;
  deliveredCount: number;
  isAdmin: boolean;
}) {
  const savedHours = parseWeeklyHours(tenant.weeklyHours);
  const [name, setName] = useState(tenant.name);
  const [tagline, setTagline] = useState(tenant.tagline ?? "");
  const [hex, setHex] = useState(initialHex);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>(isHeroStyle(tenant.heroStyle) ? tenant.heroStyle : "GRADIENT");
  const [foundedYear, setFoundedYear] = useState(tenant.foundedYear ? String(tenant.foundedYear) : "");
  const [showDelivered, setShowDelivered] = useState(tenant.showDeliveredCount);
  const [hoursOn, setHoursOn] = useState(savedHours !== null);
  const [hours, setHours] = useState<WeeklyHours>(savedHours ?? DEFAULT_WEEKLY_HOURS);
  const [schedule, setSchedule] = useState(tenant.schedule ?? "");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl);
  const [photoUrl, setPhotoUrl] = useState(tenant.storefrontPhotoUrl);
  const [previewOpen, setPreviewOpen] = useState(false);
  // "Abierto ahora" depende de la hora del navegador: la vista previa se pinta ya montado
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const now = mounted ? new Date() : null;

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreviewOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const brandColor = hexToOklch(hex) ?? tenant.brandColor;
  const year = /^\d{4}$/.test(foundedYear) ? Number(foundedYear) : null;
  const data = now
    ? buildLandingData(
        {
          ...tenant,
          name: name.trim() || tenant.name,
          tagline: tagline.trim() || null,
          brandColor,
          heroStyle,
          foundedYear: year,
          showDeliveredCount: showDelivered,
          weeklyHours: hoursOn ? JSON.stringify(hours) : null,
          schedule: schedule.trim() || null,
          logoUrl,
          storefrontPhotoUrl: photoUrl,
        },
        deliveredCount,
        now
      )
    : null;

  const preview = data && (
    <div inert style={tenantThemeVars(brandColor)} className="flex min-h-full flex-col">
      <LandingView data={data} preview />
    </div>
  );

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <form action={saveAppearanceAction} className="min-w-0">
        <fieldset disabled={!isAdmin} className="space-y-5 disabled:opacity-60">
          <section className={cardCls}>
            <h2 className="font-semibold">Apariencia</h2>
            <p className="mt-0.5 text-sm text-muted">Así te reconocen tus clientes.</p>
            <div className="mt-4">
              <label htmlFor="name" className={labelCls}>
                Nombre del taller
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="mt-5">
              <BrandColorPicker initialHex={initialHex} onChange={setHex} />
            </div>
            <fieldset className="mt-5">
              <legend className={labelCls}>Fondo del encabezado</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {HERO_STYLES.map((s) => (
                  <label key={s} className="group cursor-pointer">
                    <input
                      type="radio"
                      name="heroStyle"
                      value={s}
                      checked={heroStyle === s}
                      onChange={() => setHeroStyle(s)}
                      className="peer sr-only"
                    />
                    <span
                      className="flex h-16 items-end rounded-(--radius-control) p-2 text-sm font-semibold text-white ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-primary"
                      style={heroBackground(s, brandColor)}
                    >
                      {HERO_STYLE_LABELS[s]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className={cardCls}>
            <h2 className="font-semibold">Fotos (opcionales)</h2>
            <p className="mt-0.5 text-sm text-muted">Tu página se ve completa sin fotos. Súbelas solo si las tienes.</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <ImageField
                name="logo"
                label="Logo"
                help="Si no tienes, mostramos tu nombre en letras. PNG o JPG cuadrado, hasta 2 MB."
                currentUrl={tenant.logoUrl}
                shape="square"
                onPreviewChange={setLogoUrl}
              />
              <ImageField
                name="storefront"
                label="Foto del local"
                help="Para que te encuentren y reconozcan el lugar. Se muestra junto a tu dirección. Hasta 5 MB."
                currentUrl={tenant.storefrontPhotoUrl}
                shape="wide"
                camera
                onPreviewChange={setPhotoUrl}
              />
            </div>
          </section>

          <section className={cardCls}>
            <h2 className="font-semibold">Confianza</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div>
                <label htmlFor="foundedYear" className={labelCls}>
                  Año en que abrió
                </label>
                <input
                  id="foundedYear"
                  name="foundedYear"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1998"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value.replace(/\D/g, ""))}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="tagline" className={labelCls}>
                  Lema (opcional)
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  maxLength={120}
                  placeholder="Mecánica de confianza"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="showDeliveredCount"
                checked={showDelivered}
                onChange={(e) => setShowDelivered(e.target.checked)}
                className="h-5 w-5 accent-(--color-primary)"
              />
              Mostrar cuántos {data?.noun.many ?? "carros"} hemos entregado ({deliveredCount.toLocaleString("es-GT")})
            </label>
          </section>

          <HoursEditor
            enabled={hoursOn}
            hours={hours}
            onEnabledChange={setHoursOn}
            onHoursChange={setHours}
            defaults={DEFAULT_WEEKLY_HOURS}
            legacyText={schedule}
            onLegacyTextChange={setSchedule}
          />
          <input type="hidden" name="schedule" value={schedule} />
          <input type="hidden" name="useWeeklyHours" value={hoursOn ? "1" : "0"} />
          <input type="hidden" name="weeklyHours" value={JSON.stringify(hours)} />

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-(--radius-control) border border-border px-4 text-sm font-semibold hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer lg:hidden"
          >
            <Eye size={17} aria-hidden />
            Ver cómo queda
          </button>

          <SaveBar hint="Tu página cambia al guardar." />
        </fieldset>
      </form>

      {/* Escritorio: celular fijo a la derecha */}
      <aside className="hidden lg:block" aria-label="Vista previa en celular">
        <div className="sticky top-6">
          <p className="mb-2 text-sm font-medium text-muted">Vista previa en celular</p>
          <div className="h-[640px] overflow-y-auto overflow-x-hidden rounded-[2rem] border-8 border-ink bg-bg">
            {preview}
          </div>
        </div>
      </aside>

      {/* Móvil: vista previa a pantalla completa */}
      {previewOpen && (
        <div role="dialog" aria-modal="true" aria-label="Vista previa de tu página" className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <p className="text-sm font-semibold">Así se ve tu página</p>
            <button
              type="button"
              autoFocus
              onClick={() => setPreviewOpen(false)}
              className="inline-flex h-11 items-center gap-1.5 rounded-(--radius-control) px-3 text-sm font-semibold cursor-pointer"
            >
              <X size={18} aria-hidden />
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{preview}</div>
        </div>
      )}
    </div>
  );
}

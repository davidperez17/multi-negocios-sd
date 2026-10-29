import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { heroBackground, type LandingData } from "@/lib/landing";
import { TrackingSearch } from "@/app/t/[slug]/TrackingSearch";

// Landing pública del taller. Presentacional y sin DB: la usan la página /t/[slug]
// y la vista previa en vivo de Ajustes (preview). Medidas por contenedor (@container),
// no por ventana: la vista previa es angosta dentro de una pantalla ancha.

export function LandingView({ data, preview = false }: { data: LandingData; preview?: boolean }) {
  const { proof } = data;
  const hasProof = proof.delivered !== null || proof.since !== null;
  const hasServices = Boolean(data.tagline || data.description || data.services.length);
  const hasVisit = Boolean(data.address || data.hoursRows.length || data.legacySchedule || data.phone);
  const enter = preview ? "" : "hero-enter";
  const entregad = data.noun.feminine ? "entregada" : "entregado";
  const deliveredLabel = proof.delivered === 1 ? `${data.noun.one} ${entregad}` : `${data.noun.many} ${entregad}s`;

  return (
    <div className="@container flex flex-1 flex-col bg-bg">
      <div className="text-white" style={heroBackground(data.heroStyle, data.brandColor)}>
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <p className="flex min-w-0 items-center gap-3">
            {data.logoUrl && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.logoUrl} alt="" className="h-full w-full object-contain" />
              </span>
            )}
            <span className="min-w-0 break-words text-xl font-extrabold leading-tight tracking-tight">{data.name}</span>
          </p>
          {data.whatsappHref ? (
            <a
              href={data.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-primary shadow-sm hover:bg-white/90 transition-colors duration-150"
            >
              <MessageCircle size={17} aria-hidden />
              WhatsApp
            </a>
          ) : (
            data.phone && (
              <a
                href={`tel:${data.phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-primary shadow-sm hover:bg-white/90 transition-colors duration-150"
              >
                <Phone size={16} aria-hidden />
                Llamar
              </a>
            )
          )}
        </header>

        <section className="mx-auto max-w-5xl px-5 pt-4 pb-10 @xl:pt-10 @xl:pb-16 @5xl:grid @5xl:grid-cols-[1fr_minmax(0,26rem)] @5xl:items-center @5xl:gap-14">
          <div>
            {data.status && (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/30">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${data.status.open ? "bg-[oklch(0.82_0.17_150)]" : "bg-white/70"}`}
                />
                {data.status.label}
              </p>
            )}
            <h1
              className={`${enter} mt-4 text-balance text-[clamp(2.2rem,9cqw,3.6rem)] font-extrabold leading-[1.05] tracking-tight`}
              style={{ "--i": 0 } as React.CSSProperties}
            >
              ¿Cómo va tu {data.noun.one}?
            </h1>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-white/90">
              Pon el código que te dimos al recibirlo y mira avances, fotos y costos.
            </p>
          </div>

          <div className={`${enter} mt-7 @5xl:mt-0`} style={{ "--i": 1 } as React.CSSProperties}>
            <div className="rounded-2xl bg-white p-5 text-ink shadow-xl shadow-black/15">
              <TrackingSearch slug={data.slug} noun={data.noun.one} whatsappHref={data.whatsappHref} preview={preview} />
            </div>

            {hasProof && (
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {proof.delivered !== null && (
                  <div className="rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/25">
                    <dt className="sr-only">{deliveredLabel}</dt>
                    <dd>
                      <span className="block text-2xl font-extrabold [font-variant-numeric:tabular-nums]">
                        {proof.delivered.toLocaleString("es-GT")}
                      </span>
                      <span className="text-sm text-white/90">{deliveredLabel}</span>
                    </dd>
                  </div>
                )}
                {proof.since !== null && (
                  <div className="rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/25">
                    <dt className="sr-only">Año de apertura</dt>
                    <dd>
                      <span className="block text-2xl font-extrabold">Desde {proof.since}</span>
                      {proof.place && <span className="text-sm text-white/90">en {proof.place}</span>}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5">
        {hasServices && (
          <section className="border-b border-border py-10 @xl:py-14">
            <h2 className="text-2xl font-extrabold tracking-tight">Lo que hacemos</h2>
            {data.tagline && <p className="mt-2 text-lg font-medium">{data.tagline}</p>}
            {data.description && <p className="mt-2 max-w-2xl leading-relaxed text-muted">{data.description}</p>}
            {data.services.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {data.services.map((s) => (
                  <li key={s} className="rounded-full border border-border px-3.5 py-1.5 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-muted">Atendemos {data.vehiclePhrase.toLowerCase()}.</p>
          </section>
        )}

        {hasVisit && (
          <section className="py-10 @xl:py-14 @5xl:grid @5xl:grid-cols-2 @5xl:gap-12">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Visítanos</h2>
              {data.storefrontPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.storefrontPhotoUrl}
                  alt={`Fachada de ${data.name}`}
                  loading="lazy"
                  className="mt-5 aspect-[16/9] w-full rounded-2xl bg-surface object-cover"
                />
              )}
              {data.address && (
                <p className={`flex items-start gap-3 ${data.storefrontPhotoUrl ? "mt-4" : "mt-5 rounded-2xl bg-primary-soft p-4"}`}>
                  <MapPin size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{data.address}</span>
                    {data.city && <span className="block text-sm text-muted">{data.city}</span>}
                  </span>
                </p>
              )}
              {data.maps && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a
                    href={data.maps.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary text-sm font-bold text-primary hover:bg-primary-soft transition-colors duration-150"
                  >
                    <MapPin size={16} aria-hidden />
                    Google Maps
                  </a>
                  <a
                    href={data.maps.waze}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary text-sm font-bold text-primary hover:bg-primary-soft transition-colors duration-150"
                  >
                    <Navigation size={16} aria-hidden />
                    Waze
                  </a>
                </div>
              )}
            </div>

            <div className="mt-8 @5xl:mt-12">
              {(data.hoursRows.length > 0 || data.legacySchedule) && (
                <div>
                  <h3 className="flex items-center gap-2 font-bold">
                    <Clock size={18} className="text-primary" aria-hidden />
                    Horario
                  </h3>
                  {data.hoursRows.length > 0 ? (
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.95rem]">
                      {data.hoursRows.map((r) => (
                        <div key={r.day} className="contents">
                          <dt className="font-semibold">{r.day}</dt>
                          <dd className={r.text === "Cerrado" ? "text-muted" : ""}>
                            {/* Un tramo por línea: con cierre al mediodía se lee mejor en celular */}
                            {r.text.split(" · ").map((range) => (
                              <span key={range} className="block">
                                {range}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-3">{data.legacySchedule}</p>
                  )}
                </div>
              )}
              {data.phone && (
                <a
                  href={`tel:${data.phone.replace(/\s/g, "")}`}
                  className="mt-6 inline-flex h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <Phone size={17} aria-hidden />
                  {data.phone}
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <span>
            © {new Date().getFullYear()} {data.name}
          </span>
          <span>
            Impulsado por <span className="font-semibold text-ink">TallerLink</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

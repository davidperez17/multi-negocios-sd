# Landing personalizable del taller — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer `/t/[slug]` alrededor de "consulta tu carro con el código" y dar al dueño, desde Ajustes en pestañas con vista previa, control de fondo, logo, foto del local, confianza y horario con cierre al mediodía.

**Architecture:** Lógica pura y testeada en `src/lib/` (horario, datos de la landing, ajustes, imágenes); un componente presentacional `LandingView` sin acceso a DB que usan tanto la página pública como la vista previa de Ajustes; Ajustes con un formulario y un server action por pestaña para que guardar una pestaña nunca pise otra.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Prisma 7 + SQLite (`pnpm db:push`, sin migraciones), vitest 3, Playwright (verificación visual), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-28-landing-personalizable-design.md`

## Global Constraints

- Mobile-first: base sin prefijo = 360–390px, sin scroll horizontal; `sm:`/`lg:` agregan layout.
- Una sola familia tipográfica: Geist (800 titulares). Íconos Lucide, nunca emojis. Toques ≥ 44px. Contraste AA (texto blanco sobre el encabezado ≥ 4.5:1). `prefers-reduced-motion` respetado.
- Color de marca solo vía `tenantThemeVars()` / `safeBrandColor()`; ningún valor del usuario entra crudo a `style`.
- Toda query y acción filtra por `tenantId` de la sesión; solo ADMIN guarda Ajustes (STAFF ve solo lectura, como hoy).
- Hora y "abierto ahora" en `America/Guatemala`.
- Imágenes: JPEG/PNG/WebP por magic bytes (`sniffImageType`), nombre aleatorio, carpeta `public/uploads/<tenantId>/`.
- Copy de la landing (exacto): título "¿Cómo va tu {noun}?", línea "Pon el código que te dimos al recibirlo y mira avances, fotos y costos.", botón "Ver mi {noun}", ayuda "¿No tienes tu código? Pídelo por WhatsApp", sección "Lo que hacemos", sección "Visítanos", pie "Impulsado por TallerLink". `{noun}` = carro/moto/camión según tipos.
- **Diseño con ui-ux-pro-max (pedido del usuario, siempre):** toda tarea que toque UI (Tasks 5, 6 y 7) invoca la skill `ui-ux-pro-max` antes de escribir componentes y pasa su checklist pre-entrega antes del commit; sus recomendaciones ceden ante `PRODUCT.md`/`DESIGN.md` (ya se descartaron su paleta naranja y Lexend).
- TDD: test que falla primero; `pnpm test` completo verde antes de cada commit; commits con las líneas de atribución del repo.

## Review Focus

1. **Bordes del horario:** exactamente a la hora de cierre ya está cerrado; a la hora de apertura ya está abierto; domingo cerrado el sábado en la noche → "abre el lunes"; todos los días cerrados → sin chip. (Task 1)
2. **Guardar una pestaña no toca otra:** guardar "Mi página" con el horario apagado deja `weeklyHours = null`; guardar "Contacto" no borra logo ni horario. (Task 4)
3. **Código pegado de cualquier forma:** "tx-abc123", " ABC 123 ", el link completo `…/seguimiento/TX-ABC123` o el mensaje de WhatsApp entero → `TX-ABC123`; basura → null y mensaje de error, no request. (Task 2)
4. **Reemplazar/quitar imágenes:** el archivo viejo se borra; una URL guardada que apunte fuera de `/uploads/<tenantId>/` nunca se borra. (Task 3)
5. **Nombres largos y sin datos:** taller sin logo, foto, servicios, lema, horario ni WhatsApp se ve completo; nombre de 80 caracteres no desborda a 360px. (Tasks 5 y 7)

---

### Task 1: Horario semanal con cierre al mediodía (`src/lib/hours.ts`)

**Files:**
- Create: `src/lib/hours.ts`
- Test: `tests/hours.test.ts`

**Interfaces:**
- Produces:
  - `type Range = [open: string, close: string]` ("HH:MM", 24 h)
  - `type WeeklyHours = Record<0|1|2|3|4|5|6, Range[]>` (0 = domingo; `[]` = cerrado; máx. 2 tramos)
  - `DEFAULT_WEEKLY_HOURS: WeeklyHours` = Lun–Vie `[["08:00","18:00"]]`, Sáb `[["08:00","13:00"]]`, Dom `[]`
  - `parseWeeklyHours(json: string | null): WeeklyHours | null` (null si vacío o inválido)
  - `validateWeeklyHours(h: unknown): WeeklyHours | null` (rechaza >2 tramos, formato malo, inicio ≥ fin, traslape; ordena tramos)
  - `formatTime12(hhmm: string): string` ("14:00" → "2:00 p. m.", "08:00" → "8:00 a. m.", "12:00" → "12:00 p. m.")
  - `formatDayRanges(ranges: Range[]): string` (`[]` → "Cerrado"; dos tramos → "8:00 a. m. – 12:00 p. m. · 2:00 – 6:00 p. m.")
  - `openStatus(h: WeeklyHours, now: Date): { open: boolean; label: string } | null`

- [ ] **Step 1: Tests que fallan** — `tests/hours.test.ts`. Fechas construidas en UTC sabiendo que Guatemala = UTC−6 (sin horario de verano). Con `H` = Lun–Vie `[["08:00","12:00"],["14:00","18:00"]]`, Sáb `[["08:00","13:00"]]`, Dom `[]`:
  - martes 10:00 GT → `{ open: true, label: "Abierto ahora · cierra 12:00 p. m." }`
  - martes 12:00 GT → `{ open: false, label: "Cerrado al mediodía · abre 2:00 p. m." }` (en la hora de cierre ya cierra)
  - martes 14:00 GT → abierto, "cierra 6:00 p. m."
  - martes 07:30 GT → `"Cerrado · abre hoy 8:00 a. m."`
  - martes 19:00 GT → `"Cerrado · abre mañana 8:00 a. m."`
  - sábado 15:00 GT → `"Cerrado · abre el lunes 8:00 a. m."`
  - todos los días `[]` → `null`
  - `validateWeeklyHours` rechaza: 3 tramos, `["18:00","08:00"]`, `["08:00","13:00"]+["12:00","14:00"]`, `"8:00"` sin cero, día 7; acepta y ordena `[["14:00","18:00"],["08:00","12:00"]]`.
  - `parseWeeklyHours(null)` y `parseWeeklyHours("{roto")` → `null`; ida y vuelta `JSON.stringify(DEFAULT_WEEKLY_HOURS)`.
  - `formatTime12` y `formatDayRanges` con los ejemplos de Interfaces.

- [ ] **Step 2:** `pnpm vitest run tests/hours.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implementar** — día y minuto de Guatemala con `Intl.DateTimeFormat("en-US", { timeZone: "America/Guatemala", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })`. Buscar el siguiente tramo hacia adelante hasta 7 días; "hoy" / "mañana" / "el {lunes…domingo}". "Cerrado al mediodía" solo cuando hay un tramo más tarde el mismo día y ya pasó uno.
- [ ] **Step 4:** `pnpm vitest run tests/hours.test.ts` → PASS; `pnpm test` verde.
- [ ] **Step 5: Commit** `feat: weekly hours with midday break and open-now status`

---

### Task 2: Esquema y datos de la landing (`prisma/schema.prisma`, `src/lib/landing.ts`)

**Files:**
- Modify: `prisma/schema.prisma` (modelo `Tenant`)
- Create: `src/lib/landing.ts`
- Test: `tests/landing.test.ts`

**Interfaces:**
- Consumes: `WeeklyHours`, `parseWeeklyHours`, `openStatus`, `formatDayRanges` (Task 1); `safeBrandColor` (`src/lib/validation.ts`); `VEHICLE_TYPES` (`src/lib/status.ts`); `waNumber`.
- Produces:
  - Campos `Tenant`: `storefrontPhotoUrl String?`, `heroStyle String @default("GRADIENT")`, `foundedYear Int?`, `showDeliveredCount Boolean @default(true)`, `mapsUrl String?`, `weeklyHours String?` (JSON de `WeeklyHours`; null = sin horario por día). `logoUrl` y `schedule` (texto libre) se conservan.
  - `HERO_STYLES = ["SOLID","GRADIENT","DOTS","LINES"] as const`, `type HeroStyle`, `HERO_STYLE_LABELS` = Liso / Degradado / Puntos / Líneas
  - `heroBackground(style: string, brandColor: string): React.CSSProperties` — estilo desconocido → GRADIENT; color siempre por `safeBrandColor`; patrones blancos con alfa ≤ 0.18 sobre el color (nunca aclaran el fondo de base).
  - `vehicleNoun(types: string[]): { one: string; many: string }` — solo `MOTORCYCLE` → moto/motos; solo `TRUCK` → camión/camiones; cualquier otro caso → carro/carros.
  - `extractTrackingCode(input: string): string | null` — `TX-` + 6 de `[A-Z0-9]` en mayúsculas. No usar el alfabeto estricto de `generateTrackingCode` (`TRACKING_ALPHABET` excluye 0/O/1/I/L), porque el código demo `TX-DEMO01` y códigos viejos lo romperían; el servidor ya responde 404 si no existe.
  - `mapsLinks(t: { name; address; city; mapsUrl }): { google: string; waze: string } | null` — null sin dirección; `google` = `mapsUrl` si existe, si no búsqueda; `waze` = `https://waze.com/ul?q=<dirección, ciudad>&navigate=yes`.
  - `type LandingData` y `buildLandingData(tenant: Tenant, deliveredCount: number, now: Date): LandingData` — todo lo que `LandingView` necesita: nombre, logoUrl, storefrontPhotoUrl, heroStyle, brandColor, noun, lema, descripción, servicios[], frase de tipos ("Carros y camiones"), whatsapp (wa.me con texto "Hola, quiero consultar por mi {noun}."), teléfono, dirección, links de mapa, `status` (de `openStatus`, null si `weeklyHours` null), `hoursRows: {day: string; text: string}[]` (agrupa días consecutivos iguales: "Lun–Vie"), `legacySchedule` (texto viejo solo si no hay `weeklyHours`), `proof: { delivered: number | null; since: number | null; place: string | null }` (delivered null si `showDeliveredCount` es false o el conteo es 0).

- [ ] **Step 1: Tests que fallan** — `tests/landing.test.ts`:
  - `extractTrackingCode`: `"tx-abc123"`→`"TX-ABC123"`; `" ABC 123 "`→`"TX-ABC123"`; `"Mira tu carro: http://x/t/taller/seguimiento/TX-ABC123 gracias"`→`"TX-ABC123"`; `"TX-DEMO01"`→`"TX-DEMO01"`; `"hola"`→null; `"TX-ABC12"`→null; `"TX-ABC1234"`→null.
  - `vehicleNoun(["MOTORCYCLE"])`→`{one:"moto",many:"motos"}`; `(["TRUCK"])`→camión; `(["CAR","TRUCK"])`→carro; `([])`→carro.
  - `heroBackground("evil;position:fixed", "red;x:y")` → no contiene `position` ni `red;`, usa `DEFAULT_BRAND_COLOR`.
  - `mapsLinks` sin dirección → null; con `mapsUrl` lo usa en `google`; `waze` codifica la dirección.
  - `buildLandingData`: tenant mínimo (solo `name`, sin nada más) → `status` null, `services` [], `proof.delivered` null, `whatsapp` null, sin lanzar; `showDeliveredCount=false` con 312 → `delivered` null; `weeklyHours` null y `schedule` "Lun-Vie 8-18" → `legacySchedule` presente y `hoursRows` []; Lun–Vie iguales → una fila "Lun–Vie".
- [ ] **Step 2:** `pnpm vitest run tests/landing.test.ts` → FAIL.
- [ ] **Step 3: Implementar** campos de esquema; `pnpm db:push` y `pnpm prisma generate`; `src/lib/landing.ts` según Interfaces. **Reiniciar `pnpm dev` si está corriendo** (cliente Prisma cacheado).
- [ ] **Step 4:** PASS; `pnpm test` verde.
- [ ] **Step 5: Commit** `feat: landing data model and helpers`

---

### Task 3: Logo y foto del local (`src/lib/uploads.ts`)

**Files:**
- Modify: `src/lib/uploads.ts`
- Test: `tests/uploads.test.ts` (ampliar)

**Interfaces:**
- Produces:
  - `LOGO_MAX_BYTES = 2 * 1024 * 1024`; foto del local usa `PHOTO_MAX_BYTES` (5 MB)
  - `saveTenantImage(file: File, tenantId: string, kind: "logo" | "storefront"): Promise<string | null>` — mismo flujo que `savePhoto` (puede reutilizarlo con el límite por tipo)
  - `deleteTenantUpload(url: string | null, tenantId: string): Promise<void>` — solo borra si `url` coincide con `^/uploads/<tenantId>/[0-9a-f-]+\.(jpg|png|webp)$`; cualquier otra cosa no hace nada; archivo inexistente no lanza.

- [ ] **Step 1: Tests que fallan:** PNG válido de 3 MB como logo → null, como storefront → URL; `deleteTenantUpload` borra un archivo creado por `saveTenantImage`; con `"/uploads/otro-tenant/x.png"`, `"/uploads/<tenantId>/../../package.json"` y `"https://evil/x.png"` no borra nada (verificar que el archivo testigo sigue existiendo); borrar dos veces no lanza. Limpiar `public/uploads/<tenantId de test>` en `afterEach`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + `pnpm test`.
- [ ] **Step 5: Commit** `feat: tenant logo and storefront photo uploads`

---

### Task 4: Guardado de Ajustes por pestaña (`src/lib/tenant-settings.ts`)

**Files:**
- Create: `src/lib/tenant-settings.ts`
- Test: `tests/tenant-settings.test.ts`

**Interfaces:**
- Consumes: `validateWeeklyHours` (Task 1), `HERO_STYLES` (Task 2), `saveTenantImage`/`deleteTenantUpload` (Task 3), `parseBrandColor`, `normalizeGtPhone`/`waNumber`, `isValidEmail`, `DomainError` (`src/lib/orders.ts`), `VEHICLE_TYPES`.
- Produces (todas reciben `tenantId` de la sesión; el rol se valida en el action):
  - `saveAppearance(tenantId, input: { name: string; tagline: string; brandColor: string; heroStyle: string; foundedYear: string; showDeliveredCount: boolean; useWeeklyHours: boolean; weeklyHours: string; logo?: File | null; removeLogo: boolean; storefront?: File | null; removeStorefront: boolean }, now?: Date): Promise<{ colorAdjusted: boolean }>`
  - `saveContact(tenantId, input: { whatsapp; phone; email; address; city; mapsUrl: string }): Promise<void>`
  - `saveServices(tenantId, input: { services: string[]; vehicleTypes: string[]; description: string }): Promise<void>`
  - Códigos de `DomainError`: `invalid_name`, `color`, `invalid_style`, `invalid_year`, `invalid_hours`, `invalid_image`, `invalid_phone`, `invalid_email`, `invalid_maps`, `invalid_services`.
- Reglas: nombre 2–80; año 1900..año actual; `useWeeklyHours=false` → `weeklyHours = null` (no se lee el JSON); `mapsUrl` vacío o `https://` con host `maps.app.goo.gl`, `goo.gl`, `www.google.com`, `google.com` o `maps.google.com`; WhatsApp vacío o teléfono GT válido → guardar dígitos (`waNumber`); servicios: recortar, sin vacíos, sin duplicados (sin distinguir mayúsculas), máx. 20 de 60 caracteres, se guardan unidos por `\n` en `services`; `vehicleTypes` al menos uno de la lista; textos libres con tope 2000 como hoy. Imagen nueva reemplaza y borra la anterior; `remove*` la borra y pone null; imagen inválida → `invalid_image` sin cambiar nada.

- [ ] **Step 1: Tests que fallan** (Review Focus 2 incluido):
  - `saveAppearance` con `useWeeklyHours:false` y JSON válido → `weeklyHours` sigue null.
  - con `useWeeklyHours:true` y dos tramos → guardado y `parseWeeklyHours` lo devuelve igual; con traslape → `DomainError("invalid_hours")` y nada cambia (ni nombre).
  - `heroStyle:"NEON"` → `invalid_style`; `foundedYear:"1850"` → `invalid_year`; `"#ffe14d"` → `colorAdjusted:true`.
  - tras guardar logo, `saveContact` no toca `logoUrl` ni `weeklyHours`; reemplazar logo borra el archivo anterior.
  - `saveContact` con `mapsUrl:"https://evil.com/maps"` → `invalid_maps`; WhatsApp `"5512 3456"` → `"50255123456"`.
  - `saveServices` deduplica `["Frenos","frenos"," "]` → `"Frenos"`; `vehicleTypes:[]` → `invalid_services`.
  - aislamiento: `saveContact(tenantA.id, …)` no cambia tenant B.
- [ ] **Step 2:** FAIL. **Step 3:** implementar (validar todo antes de escribir; imágenes al final, y si la escritura en DB falla, borrar la imagen nueva). **Step 4:** PASS + `pnpm test`.
- [ ] **Step 5: Commit** `feat: per-tab tenant settings with validation`

---

### Task 5: Landing pública nueva (`LandingView`, `TrackingSearch`, página)

**Files:**
- Create: `src/components/landing/LandingView.tsx` (presentacional, sin imports de servidor; usable desde cliente)
- Modify: `src/app/t/[slug]/TrackingSearch.tsx`, `src/app/t/[slug]/page.tsx`, `src/app/globals.css` (si hacen falta utilidades de patrón)
- Test: verificación en navegador (Task 7); la lógica ya está cubierta en Tasks 1–2.

**Interfaces:**
- Consumes: `LandingData`, `buildLandingData`, `heroBackground`, `extractTrackingCode` (Task 2).
- Produces: `<LandingView data={LandingData} preview?: boolean />` — con `preview` no hay links activos ni `TrackingSearch` real (campo de muestra), para la vista previa de Task 6. `TrackingSearch` recibe `{ slug: string; noun: string; whatsappHref: string | null }`.

- [ ] **Step 0:** Invocar `ui-ux-pro-max` (`--domain ux "form input mobile"`, `--domain landing "minimal single column"`) y anotar en el commit qué se aplicó.
- [ ] **Step 1:** `TrackingSearch`: etiqueta visible "Código de seguimiento"; prefijo visual fijo `TX-` y el input recibe 6 caracteres (`maxLength` holgado para permitir pegar textos largos), `autoCapitalize="characters"`, `spellCheck={false}`, `autoComplete="off"`; al enviar o pegar usa `extractTrackingCode`; null → error "Revisa el código: son 6 letras y números después de TX-." sin hacer fetch; botón "Ver mi {noun}" con spinner; ayuda "¿No tienes tu código? Pídelo por WhatsApp" si `whatsappHref`.
- [ ] **Step 2:** `LandingView` según spec (orden: encabezado con fondo → chip de estado → título/línea → tarjeta → prueba de confianza; "Lo que hacemos"; "Visítanos"; pie). Con logo: `<img>` en contenedor cuadrado 40px con placa blanca + nombre; sin logo: solo el nombre (Geist 800, `break-words`, sin `truncate`). Foto del local con `aspect-[16/9] object-cover`, `alt="Fachada de {name}"`, `loading="lazy"`. Botones de mapa como enlaces ≥44px. Animación de entrada existente (`hero-enter`) solo en título y tarjeta. Quitar "Así de simple", los blobs con blur y el gradiente hacia blanco.
- [ ] **Step 3:** `page.tsx`: cargar tenant + `prisma.workOrder.count({ where: { tenantId, status: "DELIVERED" } })`, `buildLandingData(tenant, count, new Date())`, render `LandingView` dentro de `tenantThemeVars`. `export const dynamic = "force-dynamic"` (el chip depende de la hora). `generateMetadata`: título "{name} — ¿Cómo va tu {noun}?", `description` = lema/descripción, `openGraph` con título, descripción e imagen = foto del local si existe.
- [ ] **Step 4:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` verdes; abrir `/t/taller-rodriguez` y `/t/motogarage-velez` en el Chromium visible (CDP :9333) a 390px y 1280px y revisar capturas: sin overflow, texto del encabezado legible en los 4 estilos.
- [ ] **Step 5: Commit** `feat: redesigned workshop landing centered on tracking code`

---

### Task 6: Ajustes en pestañas con vista previa

**Files:**
- Modify: `src/app/admin/(app)/ajustes/page.tsx` (pestañas por `?tab=pagina|contacto|servicios`, default `pagina`), `src/app/admin/actions.ts` (reemplazar `updateTenantSettings` por `saveAppearanceAction`, `saveContactAction`, `saveServicesAction`)
- Create: `src/app/admin/(app)/ajustes/AppearanceForm.tsx` (cliente: estado del formulario + vista previa), `HoursEditor.tsx`, `ServicesEditor.tsx`, `ImageField.tsx`
- Reuse: `BrandColorPicker.tsx` (ya existe)

**Interfaces:**
- Consumes: `saveAppearance`/`saveContact`/`saveServices` (Task 4), `LandingView`/`buildLandingData` (Tasks 2 y 5), `DEFAULT_WEEKLY_HOURS`, `HERO_STYLE_LABELS`.
- Produces: actions que redirigen a `/admin/ajustes?tab=<tab>&saved=1[&ajustado=1]` o `?tab=<tab>&error=<code>`; revalidan `/admin/ajustes` y `/t/<slug>`; rol ADMIN obligatorio (`error=role`).

- [ ] **Step 0:** Invocar `ui-ux-pro-max` (`--domain ux "tabs settings form preview upload"`) antes de los componentes.
- [ ] **Step 1:** Pestañas como enlaces (`aria-current="page"`), cada una con su propio `<form>` y botón "Guardar" (fijo abajo en celular). STAFF: `fieldset disabled` + aviso, como hoy. Mensajes de error por código en español junto al campo/arriba del botón, `role="alert"`.
- [ ] **Step 2:** "Mi página" (`AppearanceForm`): nombre, color (`BrandColorPicker`), fondo (4 opciones con muestra, `role="radiogroup"`), Logo y Foto del local (`ImageField`: vista previa, "Quitar", input `accept="image/jpeg,image/png,image/webp"`; la foto con `capture="environment"` y texto "Tomar o subir foto"), Confianza (año, lema, casilla "Mostrar cuántos carros hemos entregado (N)" con N real), Horario (`HoursEditor`: interruptor "Usar horario por día" apagado si `weeklyHours` es null; por día interruptor abierto, tramo, "Agregar cierre al mediodía"/"Quitar", "Copiar el horario del lunes a toda la semana"; al encender carga `DEFAULT_WEEKLY_HOURS`; envía JSON en input oculto).
- [ ] **Step 3:** Vista previa: en `lg:` columna derecha fija con `LandingView preview` dentro de un marco de celular de 360px escalado; en celular botón "Ver cómo queda" que abre la vista previa a pantalla completa con "Cerrar". Se alimenta del estado del formulario (imágenes nuevas con `URL.createObjectURL`). Calcular el chip con `openStatus(hours, new Date())` en cliente.
- [ ] **Step 4:** "Contacto": WhatsApp, teléfono, correo, dirección, ciudad, link de Google Maps (ayuda: "Opcional. Pega el link de 'Compartir' de Google Maps."). "Servicios": `ServicesEditor` (etiquetas, agregar con Enter/botón, quitar con botón con `aria-label`), tipos de vehículo, descripción.
- [ ] **Step 5:** `tsc`, `lint`, `pnpm test`, `pnpm build` verdes. En el Chromium visible: guardar cada pestaña, cambiar fondo/logo/foto/horario y ver la vista previa y luego `/t/<slug>`; STAFF ve solo lectura.
- [ ] **Step 6: Commit** `feat: tabbed settings with live landing preview`

---

### Task 7: Seed, documentación y recorrido completo

**Files:**
- Modify: `prisma/seed.ts`, `CLAUDE.md`, `DESIGN.md`
- Create: script de recorrido en el scratchpad (no se versiona)

- [ ] **Step 1:** Seed: Taller Rodríguez con `weeklyHours` partido (Lun–Vie 8–12 y 14–18, Sáb 8–13), `foundedYear: 1998`, `heroStyle: "GRADIENT"`; Moto Garage Vélez con `heroStyle: "DOTS"` y sin `weeklyHours` (prueba la ruta de texto viejo). Correr `pnpm db:seed` solo tras respaldar `dev.db` (contiene `taller-juarez` del usuario: respaldar y, si el seed lo borra, avisar en vez de restaurar a mano sin preguntar).
- [ ] **Step 2:** Docs: `CLAUDE.md` (campos nuevos, `src/lib/hours.ts`, una acción por pestaña, imágenes por tenant y `deleteTenantUpload`), `DESIGN.md` (landing: una acción, sin fotos de fondo, 4 estilos de encabezado).
- [ ] **Step 3:** Recorrido en el Chromium visible (CDP :9333), con taller de prueba nuevo creado en `/registro` y borrado al final (tenant + `public/uploads/<id>`): taller vacío se ve completo (Review Focus 5) con nombre de 80 caracteres a 360px; subir logo y foto, reemplazar y quitar (archivo viejo desaparece); horario con mediodía y chip; los 4 fondos con contraste legible; pegar el link completo de seguimiento en el campo (Review Focus 3); taller solo motos dice "moto"; vista previa en celular y escritorio; STAFF solo lectura; sin errores de consola.
- [ ] **Step 4:** `pnpm test`, `tsc`, `lint`, `pnpm build` verdes.
- [ ] **Step 5: Commit** `docs: landing customization rules; seed showcases new landing`

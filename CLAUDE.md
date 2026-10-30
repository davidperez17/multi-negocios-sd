# multi-tenant-sd (TallerLink)

SaaS multi-tenant para talleres de vehículos (carros, motos, camiones). MVP: admin del taller + landing pública por tenant con seguimiento de reparación en tiempo real.

## Stack
- Next.js (App Router, Turbopack) + TypeScript + Tailwind v4 (tokens OKLCH en `src/app/globals.css`)
- Prisma 7 + SQLite (`dev.db` en raíz) con driver adapter `@prisma/adapter-better-sqlite3` (export: `PrismaBetterSqlite3`)
- **pnpm siempre** (no npm)
- Auth: cookie HMAC propia (`src/lib/auth.ts`), sesión 7 días

## Comandos
- `pnpm dev` · `pnpm build` · `pnpm test` (vitest, SQLite desechable en `.vitest/`) · `pnpm db:push` · `pnpm db:seed`
- Seed: 2 tenants demo. Logins: `marco@tallerrodriguez.gt` / `camila@motogaragevelez.gt`, password `demo1234`. Tracking demo: `TX-DEMO01` en `/t/taller-rodriguez`.

## Arquitectura
- Multi-tenant por path: `/t/[slug]` landing pública, `/t/[slug]/seguimiento/[code]` tracking (polling 10s a `/api/track/[slug]/[code]`).
- Admin en `/admin` (route group `(app)` con guard; login fuera del grupo). Server actions en `src/app/admin/actions.ts` son delgados: parsean el form (`src/lib/validation.ts`) y delegan a `src/lib/orders.ts`. **Toda query filtra por `tenantId` de la sesión; nunca confiar en ids del form** (verificar pertenencia con `findFirst({ id, tenantId })`).
- Aprobación de presupuesto (`src/lib/approval.ts`): guarda `approvedTotalCents`; editar items tras aprobar la invalida y regresa a `WAITING_APPROVAL`.
- PIN de costos y login con bloqueo 15 min tras 5 fallos (contadores en DB). PIN viaja en header `x-cost-pin`, nunca en la URL.
- Registro propio en `/registro` (`src/lib/signup.ts`): crea tenant + dueño ADMIN con `trialEndsAt` = +30 días. Acceso al panel por `tenantAccess()` (`src/lib/access.ts`): prueba vigente, `paidUntil` vigente, o ambos null (tenants creados a mano). Vencido → `requireUser()` redirige a `/admin/plan`; el seguimiento público nunca se bloquea. Pago manual: `pnpm tenant:activate <slug> [meses]`. `SALES_WHATSAPP` (env, dígitos con 502) arma el link "Activar mi plan".
- Equipo (`src/lib/team.ts`, `/admin/equipo`): solo ADMIN gestiona usuarios de su tenant; STAFF hace todo lo de órdenes pero no ajustes ni equipo. `User.active=false` invalida login y sesión al instante (`sessionUser`); resetear contraseña sube `User.sessionVersion` y mata sesiones abiertas. `Tenant.ownerId` (quien se registró) no puede ser degradado, desactivado ni reseteado por otro ADMIN. Nunca dejar un tenant sin ADMIN activo.
- Anti-abuso: `hitRateLimit()` (`src/lib/rate-limit.ts`, tabla `RateLimit`) limita registros y logins por IP (`x-forwarded-for`: desplegar detrás de un proxy que lo reescriba).
- `Tenant.whatsapp` = solo dígitos con 502 (para `wa.me`); armar links con `waNumber()`. `Tenant.phone` es el formato legible.
- Landing pública (`/t/[slug]`): `buildLandingData()` (`src/lib/landing.ts`, puro) → `<LandingView>` (`src/components/landing/`, sin DB, medidas por `@container`); la misma vista sirve de vista previa en Ajustes. Horario por día en `Tenant.weeklyHours` (JSON, 1–2 tramos por día, `src/lib/hours.ts`; null = sin horario, se muestra `schedule` en texto). Fondo del encabezado `heroStyle` (SOLID/GRADIENT/DOTS/LINES) vía `heroBackground()`: nunca aclara el color de marca.
- Ajustes: una pestaña = un formulario = un server action (`saveAppearance`/`saveContact`/`saveServices` en `src/lib/tenant-settings.ts`); guardar una pestaña nunca pisa otra. Logo/foto del local con `saveTenantImage()`; al reemplazar o quitar se borra el archivo con `deleteTenantUpload()` (solo dentro de `/uploads/<tenantId>/`).
- Módulos que usan componentes de cliente no pueden importar Prisma: por eso existen `tenant-theme.ts` y `tenant-settings-limits.ts`.
- Deploy: correr `pnpm db:push` antes de levantar código nuevo (no hay migraciones). Variables en `.env.example`. `tenant:activate` sobre un tenant creado a mano lo convierte en plan con vencimiento.
- Server actions y pages del panel usan `requireUser()` de `src/lib/auth.ts` (sesión + usuario activo + plan vigente); no reimplementarlo.
- `SESSION_SECRET` ≥ 32 caracteres en producción o la app falla al firmar sesiones. `brandColor` solo `oklch(...)`; en `style` usar `safeBrandColor()`/`tenantThemeVars()`.
- Branding por tenant: `Tenant.brandColor` (OKLCH) sobreescribe `--color-primary` vía `tenantThemeVars()` en `src/lib/tenant.ts`.
- Estados de orden y etiquetas ES en `src/lib/status.ts` (SQLite no soporta enums → String + constantes TS).
- Dinero en centavos de quetzal (`unitCents`, Int). Formato es-GT / GTQ en `src/lib/format.ts`. Contexto: Guatemala (teléfonos +502, zonas, placas P-/C-/M-).

## Diseño
- **Todo diseño/UI pasa por la skill `ui-ux-pro-max`** (búsqueda y checklist pre-entrega), sin contradecir `PRODUCT.md`/`DESIGN.md`.
- Leer `PRODUCT.md` y `DESIGN.md` antes de tocar UI. Admin = registro product (denso, Restrained); landing pública = registro brand (Committed con color del tenant).
- **Mobile-first obligatorio**: base sin prefijo = móvil (1 columna, stack vertical); `sm:`/`md:`/`lg:` agregan layout. Tablas siempre en contenedor `overflow-x-auto`. Nada de anchos fijos que desborden en 360px.

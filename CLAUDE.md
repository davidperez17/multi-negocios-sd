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
- `SESSION_SECRET` ≥ 32 caracteres en producción o la app falla al firmar sesiones. `brandColor` solo `oklch(...)`; en `style` usar `safeBrandColor()`/`tenantThemeVars()`.
- Branding por tenant: `Tenant.brandColor` (OKLCH) sobreescribe `--color-primary` vía `tenantThemeVars()` en `src/lib/tenant.ts`.
- Estados de orden y etiquetas ES en `src/lib/status.ts` (SQLite no soporta enums → String + constantes TS).
- Dinero en centavos de quetzal (`unitCents`, Int). Formato es-GT / GTQ en `src/lib/format.ts`. Contexto: Guatemala (teléfonos +502, zonas, placas P-/C-/M-).

## Diseño
- Leer `PRODUCT.md` y `DESIGN.md` antes de tocar UI. Admin = registro product (denso, Restrained); landing pública = registro brand (Committed con color del tenant).
- **Mobile-first obligatorio**: base sin prefijo = móvil (1 columna, stack vertical); `sm:`/`md:`/`lg:` agregan layout. Tablas siempre en contenedor `overflow-x-auto`. Nada de anchos fijos que desborden en 360px.

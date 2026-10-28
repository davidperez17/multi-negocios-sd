import Link from "next/link";
import { Wrench, LayoutDashboard, ClipboardList, Users, UserCog, Settings, LogOut, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PLAN_PRICE_LABEL, salesContactUrl, tenantAccess } from "@/lib/access";
import { logout } from "../actions";
import { NavLink } from "./NavLink";
import { safeBrandColor } from "@/lib/validation";
import { tenantThemeVars } from "@/lib/tenant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const access = tenantAccess(user.tenant);
  const salesUrl = salesContactUrl(user.tenant.name);

  const nav = [
    { href: "/admin", label: "Tablero", icon: LayoutDashboard, exact: true },
    { href: "/admin/ordenes", label: "Órdenes", icon: ClipboardList, exact: false },
    { href: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
    { href: "/admin/equipo", label: "Equipo", icon: UserCog, exact: false },
    { href: "/admin/ajustes", label: "Ajustes", icon: Settings, exact: false },
  ];

  return (
    // El panel también lleva el color de marca del taller (botones, navegación activa, banner)
    <div style={tenantThemeVars(user.tenant.brandColor)} className="flex-1 flex flex-col md:flex-row min-h-dvh">
      {/* Móvil: barra superior de marca. Desktop: sidebar fija */}
      <aside className="md:w-60 md:shrink-0 bg-surface-2 border-b md:border-b-0 md:border-r border-border">
        <div className="flex items-center justify-between md:flex-col md:items-stretch md:justify-start min-w-0 md:h-dvh md:sticky md:top-0">
          <div className="px-4 py-3 md:py-5 flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: safeBrandColor(user.tenant.brandColor) }}
            >
              <Wrench size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{user.tenant.name}</p>
              <p className="text-xs text-muted leading-tight truncate">{user.name}</p>
            </div>
          </div>

          {/* Nav desktop (sidebar) */}
          <nav className="hidden md:flex md:flex-col gap-1 px-3 mt-2 flex-1">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} exact={item.exact} label={item.label}>
                <item.icon size={17} aria-hidden />
              </NavLink>
            ))}
          </nav>

          {/* Móvil: salir a la derecha de la barra superior */}
          <form action={logout} className="md:hidden pr-2">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="flex h-11 w-11 items-center justify-center rounded-(--radius-control) text-muted hover:bg-surface hover:text-ink transition-colors duration-150 cursor-pointer"
            >
              <LogOut size={18} aria-hidden />
            </button>
          </form>

          <div className="hidden md:block px-3 pb-4 space-y-1">
            <Link
              href={`/t/${user.tenant.slug}`}
              target="_blank"
              className="flex items-center gap-2.5 rounded-(--radius-control) px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink transition-colors duration-150"
            >
              <ExternalLink size={17} aria-hidden />
              Ver mi landing
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 rounded-(--radius-control) px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink transition-colors duration-150 cursor-pointer"
              >
                <LogOut size={17} aria-hidden />
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* pb en móvil reserva espacio para la barra inferior fija */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        {access.state === "trial" && (
          <div className="border-b border-border bg-primary-soft px-5 py-2.5 text-sm">
            <p className="mx-auto max-w-5xl">
              <span className="font-semibold">
                Prueba gratis: te queda{access.daysLeft === 1 ? "" : "n"} {access.daysLeft} día
                {access.daysLeft === 1 ? "" : "s"}.
              </span>{" "}
              Después, {PLAN_PRICE_LABEL}.{" "}
              {salesUrl && (
                <a
                  href={salesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Activar mi plan
                </a>
              )}
            </p>
          </div>
        )}
        <div className="mx-auto max-w-5xl px-5 py-6 md:py-8">{children}</div>
      </main>

      {/* Móvil: barra de navegación inferior fija (DESIGN.md) */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 inset-x-0 z-20 md:hidden grid grid-cols-5 bg-surface-2 border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        {nav.map((item) => (
          <NavLink key={item.href} href={item.href} exact={item.exact} label={item.label} variant="bottom">
            <item.icon size={20} aria-hidden />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

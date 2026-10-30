import { redirect } from "next/navigation";
import { Wrench, MessageCircle, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_PRICE_LABEL, salesContactUrl, tenantAccess } from "@/lib/access";
import { logout } from "../actions";

export const metadata = { title: "Activa tu plan — TallerLink" };

// Fuera del grupo (app): debe abrir aunque el plan haya vencido
export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (tenantAccess(user.tenant).state !== "expired") redirect("/admin");
  const salesUrl = salesContactUrl(user.tenant.name);
  const wasPaid = Boolean(user.tenant.paidUntil);
  const isAdmin = user.role === "ADMIN";

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="flex items-center gap-2 font-extrabold text-xl mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Wrench size={17} aria-hidden />
          </span>
          TallerLink
        </p>
        <h1 className="text-2xl font-bold">{wasPaid ? "Tu plan venció" : "Tu prueba terminó"}</h1>
        <p className="mt-2 text-muted">
          Todo lo que registraste en <span className="font-medium text-ink">{user.tenant.name}</span> sigue guardado, y
          tus clientes pueden seguir viendo sus carros.{" "}
          {isAdmin ? (
            <>
              {wasPaid ? "Renueva" : "Activa"} tu plan para volver a usar el panel:{" "}
              <span className="font-semibold text-ink">{PLAN_PRICE_LABEL}</span>, sin costo de instalación.
            </>
          ) : (
            "Pídele al administrador del taller que active el plan para volver a usar el panel."
          )}
        </p>

        {!isAdmin ? null : salesUrl ? (
          <a
            href={salesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-(--radius-control) bg-primary font-semibold text-white hover:bg-primary-hover transition-colors duration-150"
          >
            <MessageCircle size={18} aria-hidden />
            Activar por WhatsApp
          </a>
        ) : (
          <p className="mt-8 rounded-(--radius-card) bg-surface p-4 text-sm">
            Escríbenos para activar tu plan y te habilitamos el acceso el mismo día.
          </p>
        )}

        <form action={logout} className="mt-4">
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-(--radius-control) border border-border text-sm font-medium text-muted hover:text-ink transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={16} aria-hidden />
            Salir
          </button>
        </form>
      </div>
    </main>
  );
}

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/team";
import { changeWorkerPassword, changeWorkerRole, createWorker, toggleWorker } from "../../actions";

export const metadata = { title: "Equipo — TallerLink" };

const inputCls = "w-full h-10 rounded-(--radius-control) border border-border bg-bg px-3 text-sm placeholder:text-muted";
const btnCls =
  "h-10 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Solo un administrador puede cambiar el equipo.",
  invalid_name: "Escribe el nombre del trabajador.",
  invalid_email: "Revisa el correo, parece incompleto.",
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
  invalid_role: "Elige un rol válido.",
  email_taken: "Ese correo ya tiene una cuenta en TallerLink.",
  user_not_found: "Ese usuario no es de tu taller.",
  last_admin: "El taller debe quedar con al menos un administrador activo.",
};

const OK_MESSAGES: Record<string, string> = {
  added: "Trabajador agregado. Pásale su correo y contraseña para que entre.",
  enabled: "Acceso activado.",
  disabled: "Acceso desactivado. Esa persona ya no puede entrar.",
  role: "Rol actualizado.",
  password: "Contraseña cambiada. Pásale la nueva para que entre.",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const members = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <h1 className="text-xl font-bold">Equipo</h1>
      <p className="mt-1 text-sm text-muted">
        Cada persona entra con su propio usuario y registra avances, fotos y costos. Los administradores también
        manejan los ajustes y el equipo.
      </p>

      {ok && OK_MESSAGES[ok] && (
        <p role="status" className="mt-6 rounded-(--radius-card) bg-primary-soft p-3.5 text-sm">
          {OK_MESSAGES[ok]}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 text-sm text-danger">
          {ERROR_MESSAGES[error] ?? "No se pudo guardar el cambio."}
        </p>
      )}

      {isAdmin ? (
        <form action={createWorker} className="mt-6 rounded-(--radius-card) border border-border p-4 max-w-3xl">
          <h2 className="font-semibold">Agregar a alguien</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Nombre
              </label>
              <input id="name" name="name" required maxLength={80} className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Correo
              </label>
              <input id="email" name="email" type="email" required autoComplete="off" className={inputCls} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Contraseña inicial
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                minLength={8}
                maxLength={72}
                autoComplete="off"
                placeholder="Mínimo 8 caracteres"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1.5">
                Rol
              </label>
              <select id="role" name="role" defaultValue="STAFF" className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 h-10 rounded-(--radius-control) bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
          >
            Agregar al equipo
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-(--radius-card) bg-surface p-4 text-sm text-muted">
          Solo un administrador del taller puede agregar o cambiar personas.
        </p>
      )}

      <ul className="mt-8 divide-y divide-border rounded-(--radius-card) border border-border max-w-3xl">
        {members.map((m) => {
          const isSelf = m.id === user.id;
          return (
            <li key={m.id} className={`px-4 py-4 ${m.active ? "" : "bg-surface"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium min-w-0 break-words">
                  {m.name}
                  {isSelf && <span className="text-muted font-normal"> (tú)</span>}
                </p>
                <p className="text-sm text-muted">
                  {ROLE_LABELS[m.role as Role] ?? m.role}
                  {!m.active && " · Sin acceso"}
                </p>
              </div>
              <p className="text-sm text-muted break-all">{m.email}</p>

              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={changeWorkerRole} className="flex gap-2">
                    <input type="hidden" name="userId" value={m.id} />
                    <label htmlFor={`role-${m.id}`} className="sr-only">
                      Rol de {m.name}
                    </label>
                    <select
                      id={`role-${m.id}`}
                      name="role"
                      defaultValue={m.role}
                      className="h-10 rounded-(--radius-control) border border-border bg-bg px-2.5 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={btnCls}>
                      Cambiar rol
                    </button>
                  </form>

                  {!isSelf && (
                    <form action={toggleWorker}>
                      <input type="hidden" name="userId" value={m.id} />
                      <input type="hidden" name="active" value={m.active ? "0" : "1"} />
                      <button type="submit" className={btnCls}>
                        {m.active ? "Quitar acceso" : "Devolver acceso"}
                      </button>
                    </form>
                  )}

                  <form action={changeWorkerPassword} className="flex gap-2 w-full sm:w-auto">
                    <input type="hidden" name="userId" value={m.id} />
                    <label htmlFor={`pw-${m.id}`} className="sr-only">
                      Nueva contraseña para {m.name}
                    </label>
                    <input
                      id={`pw-${m.id}`}
                      name="password"
                      type="text"
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="off"
                      placeholder="Nueva contraseña"
                      className={`${inputCls} min-w-0 sm:w-44`}
                    />
                    <button type="submit" className={`${btnCls} shrink-0`}>
                      Cambiar
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { login } from "../actions";

export const metadata = { title: "Entrar — TallerLink" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="flex items-center gap-2 font-extrabold text-xl mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Wrench size={17} aria-hidden />
          </span>
          TallerLink
        </p>
        <h1 className="text-2xl font-bold">Panel del taller</h1>
        <p className="mt-1.5 text-sm text-muted">Entra con tu cuenta para administrar tus órdenes.</p>

        <form action={login} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@taller.gt"
              className="w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error === "locked"
                ? "Demasiados intentos fallidos. Por seguridad, espera 15 minutos e intenta de nuevo."
                : "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo."}
            </p>
          )}
          <button
            type="submit"
            className="w-full h-11 rounded-(--radius-control) bg-primary font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <div className="mt-8 rounded-(--radius-card) bg-surface p-4 text-xs text-muted leading-relaxed">
          <p className="font-semibold text-ink mb-1">Cuentas demo</p>
          <p>marco@tallerrodriguez.gt · demo1234</p>
          <p>camila@motogaragevelez.gt · demo1234</p>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_PRICE_LABEL } from "@/lib/access";
import { TRIAL_DAYS } from "@/lib/signup";
import { signup } from "../admin/actions";

export const metadata = { title: "Prueba gratis — TallerLink" };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_name: "Escribe el nombre de tu taller (de 2 a 80 caracteres).",
  invalid_owner: "Escribe tu nombre.",
  invalid_phone: "El WhatsApp debe tener 8 dígitos, por ejemplo 5512 3456.",
  invalid_email: "Revisa tu correo, parece incompleto.",
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
  email_taken: "Ese correo ya tiene una cuenta. Entra con él o usa otro.",
};

const inputCls = "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="flex items-center gap-2 font-extrabold text-xl mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Wrench size={17} aria-hidden />
          </span>
          TallerLink
        </p>
        <h1 className="text-2xl font-bold">Prueba gratis {TRIAL_DAYS} días</h1>
        <p className="mt-1.5 text-sm text-muted">
          Crea tu taller y empieza a registrar cada carro hoy. Sin tarjeta. Después, {PLAN_PRICE_LABEL}.
        </p>

        <form action={signup} className="mt-8 space-y-5">
          <div>
            <label htmlFor="workshopName" className={labelCls}>
              Nombre del taller
            </label>
            <input
              id="workshopName"
              name="workshopName"
              required
              maxLength={80}
              autoComplete="organization"
              placeholder="Taller Méndez"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="ownerName" className={labelCls}>
              Tu nombre
            </label>
            <input id="ownerName" name="ownerName" required maxLength={80} autoComplete="name" className={inputCls} />
          </div>
          <div>
            <label htmlFor="whatsapp" className={labelCls}>
              WhatsApp del taller
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="5512 3456"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@taller.gt"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              aria-describedby="password-hint"
              className={inputCls}
            />
            <p id="password-hint" className="mt-1.5 text-xs text-muted">
              Mínimo 8 caracteres.
            </p>
          </div>
          {/* Honeypot anti-bots: invisible para personas */}
          <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
            <label htmlFor="website">No llenar</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {ERROR_MESSAGES[error] ?? "No pudimos crear tu taller. Revisa los datos e intenta de nuevo."}
            </p>
          )}
          <button
            type="submit"
            className="w-full h-11 rounded-(--radius-control) bg-primary font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
          >
            Crear mi taller
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="font-medium text-primary hover:underline underline-offset-4">
            Entra aquí
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { signup, type SignupState } from "../admin/actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_name: "Escribe el nombre de tu taller (de 2 a 80 caracteres).",
  invalid_owner: "Escribe tu nombre.",
  invalid_phone: "El WhatsApp debe tener 8 dígitos, por ejemplo 5512 3456.",
  invalid_email: "Revisa tu correo, parece incompleto.",
  weak_password: "La contraseña debe tener entre 8 y 72 caracteres.",
  email_taken: "Ese correo ya tiene una cuenta. Entra con él o usa otro.",
  rate_limited: "Se crearon demasiados talleres desde esta conexión. Intenta de nuevo en una hora.",
};

const inputCls = "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, {});
  const v = state.values;

  return (
    <form action={action} className="mt-8 space-y-5">
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
          defaultValue={v?.workshopName}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="ownerName" className={labelCls}>
          Tu nombre
        </label>
        <input
          id="ownerName"
          name="ownerName"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={v?.ownerName}
          className={inputCls}
        />
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
          defaultValue={v?.whatsapp}
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
          defaultValue={v?.email}
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
          De 8 a 72 caracteres.
        </p>
      </div>
      {/* Honeypot anti-bots: invisible para personas */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="website">No llenar</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {ERROR_MESSAGES[state.error] ?? "No pudimos crear tu taller. Revisa los datos e intenta de nuevo."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full h-11 items-center justify-center gap-2 rounded-(--radius-control) bg-primary font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
      >
        {pending && <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {pending ? "Creando tu taller…" : "Crear mi taller"}
      </button>
    </form>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

// Barra de guardar fija al pie del formulario; en móvil queda encima de la navegación inferior.
export function SaveBar({ hint }: { hint: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-20 z-10 -mx-5 flex items-center gap-3 border-t border-border bg-bg/95 px-5 py-3 backdrop-blur-sm md:bottom-0">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
      >
        {pending && <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <span className="text-sm text-muted">{hint}</span>
    </div>
  );
}

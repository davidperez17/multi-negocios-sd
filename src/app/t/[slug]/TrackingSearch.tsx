"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { extractTrackingCode } from "@/lib/landing";

// Campo del código con "TX-" fijo: el cliente teclea solo 6 caracteres, o pega el link/mensaje completo.
export function TrackingSearch({
  slug,
  noun,
  whatsappHref,
  preview = false,
}: {
  slug: string;
  noun: string;
  whatsappHref: string | null;
  preview?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return;
    const code = extractTrackingCode(value);
    if (!code) {
      setError("Revisa el código: son 6 letras y números después de TX-.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/track/${slug}/${code}`);
    if (res.ok) {
      router.push(`/t/${slug}/seguimiento/${code}`);
      return;
    }
    setLoading(false);
    setError(`No encontramos una orden con ${code}. Revisa que esté bien escrito o pídelo por WhatsApp.`);
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const code = extractTrackingCode(e.clipboardData.getData("text"));
    if (!code) return;
    e.preventDefault();
    setValue(code.slice(3));
    setError(null);
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor="tracking-code" className="block text-sm font-semibold text-ink">
        Código de seguimiento
      </label>
      <div className="mt-2 flex h-13 overflow-hidden rounded-xl border border-border bg-white focus-within:outline-2 focus-within:outline-primary">
        <span aria-hidden className="flex items-center bg-surface px-3.5 font-mono text-lg font-bold text-muted">
          TX-
        </span>
        <input
          id="tracking-code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ABC234"
          aria-describedby="tracking-help"
          aria-invalid={error ? true : undefined}
          value={value}
          onPaste={onPaste}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            if (error) setError(null);
          }}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-lg tracking-[0.15em] text-ink placeholder:text-muted/70 focus:outline-none"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2.5 text-sm text-danger leading-relaxed">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white hover:bg-primary-hover cursor-pointer transition-colors duration-150 disabled:opacity-70 disabled:cursor-wait"
      >
        {loading ? (
          <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <ArrowRight size={18} aria-hidden />
        )}
        {loading ? "Buscando…" : `Ver mi ${noun}`}
      </button>
      <p id="tracking-help" className="mt-3 text-sm text-muted">
        {whatsappHref ? (
          <>
            ¿No tienes tu código?{" "}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Pídelo por WhatsApp
            </a>
          </>
        ) : (
          "Lo encuentras en tu boleta o en el mensaje que te envió el taller."
        )}
      </p>
    </form>
  );
}

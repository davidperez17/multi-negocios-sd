"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, LoaderCircle } from "lucide-react";

export function TrackingSearch({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized) {
      setError("Escribe el código que te dio el taller, por ejemplo TX-ABC123.");
      return;
    }
    const withPrefix = normalized.startsWith("TX-") ? normalized : `TX-${normalized}`;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/track/${slug}/${withPrefix}`);
    if (res.ok) {
      router.push(`/t/${slug}/seguimiento/${withPrefix}`);
      return;
    }
    setLoading(false);
    setError("No encontramos una orden con ese código. Revisa que esté bien escrito o llama al taller.");
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor="tracking-code" className="block text-sm font-medium text-ink mb-2">
        Código de seguimiento
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="tracking-code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="TX-ABC123"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          className="w-full sm:w-auto sm:flex-1 h-13 shrink-0 rounded-xl border border-border bg-white px-4 font-mono text-lg tracking-wider text-ink placeholder:text-muted transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-13 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-default"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Search size={18} aria-hidden />}
          Consultar
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2.5 text-sm text-danger leading-relaxed">
          {error}
        </p>
      ) : (
        <p className="mt-2.5 text-sm text-muted">
          Lo encuentras en tu boleta o en el mensaje que te envió el taller.
        </p>
      )}
    </form>
  );
}

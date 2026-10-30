"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_SERVICES, SERVICE_MAX_LENGTH } from "@/lib/tenant-settings-limits";

// Servicios como etiquetas: se agregan con Enter o con el botón y se quitan una por una.
export function ServicesEditor({ initial }: { initial: string[] }) {
  const [services, setServices] = useState(initial);
  const [draft, setDraft] = useState("");
  const full = services.length >= MAX_SERVICES;

  function add() {
    const s = draft.trim();
    if (!s || full) return;
    if (!services.some((x) => x.toLocaleLowerCase("es") === s.toLocaleLowerCase("es"))) setServices([...services, s]);
    setDraft("");
  }

  return (
    <div>
      <label htmlFor="service-draft" className="block text-sm font-medium mb-1.5">
        Lo que hacen en tu taller
      </label>
      <div className="flex gap-2">
        <input
          id="service-draft"
          value={draft}
          maxLength={SERVICE_MAX_LENGTH}
          disabled={full}
          placeholder={full ? `Máximo ${MAX_SERVICES} servicios` : "Ej. Frenos y suspensión"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-11 min-w-0 flex-1 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || full}
          className="inline-flex h-11 items-center gap-1.5 rounded-(--radius-control) border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-soft transition-colors duration-150 cursor-pointer disabled:border-border disabled:text-muted disabled:cursor-not-allowed"
        >
          <Plus size={16} aria-hidden />
          Agregar
        </button>
      </div>
      {/* Lo escrito sin tocar "Agregar" también se guarda (el servidor descarta duplicados) */}
      {draft.trim() && !full && <input type="hidden" name="services" value={draft.trim()} />}
      {services.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {services.map((s) => (
            <li key={s} className="inline-flex items-center gap-1 rounded-full border border-border py-1 pl-3.5 pr-1 text-sm">
              {s}
              <button
                type="button"
                onClick={() => setServices(services.filter((x) => x !== s))}
                aria-label={`Quitar ${s}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink cursor-pointer"
              >
                <X size={14} aria-hidden />
              </button>
              <input type="hidden" name="services" value={s} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Aún no agregas servicios. Si no agregas ninguno, la sección no aparece en tu página.</p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { BRAND_PRESETS } from "@/lib/validation";

// Selector de color de marca: sugeridos + personalizado. Envía hex; el servidor lo guarda en OKLCH.
export function BrandColorPicker({ initialHex }: { initialHex: string }) {
  const [hex, setHex] = useState(initialHex);
  const pickerRef = useRef<HTMLInputElement>(null);
  const isPreset = BRAND_PRESETS.some((p) => p.hex === hex);

  function openPicker() {
    const input = pickerRef.current;
    if (!input) return;
    // showPicker abre el selector nativo; click() cubre navegadores sin soporte
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {}
    }
    input.click();
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-1.5">Color de marca</legend>
      <input type="hidden" name="brandColor" value={hex} />

      <div className="relative flex flex-wrap gap-2">
        {BRAND_PRESETS.map((p) => {
          const selected = p.hex === hex;
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => setHex(p.hex)}
              aria-pressed={selected}
              aria-label={p.label}
              title={p.label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-bg transition-shadow duration-150 cursor-pointer aria-pressed:ring-2 aria-pressed:ring-ink"
              style={{ background: p.hex }}
            >
              {selected && <Check size={18} aria-hidden />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={openPicker}
          aria-pressed={!isPreset}
          className={`flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium cursor-pointer transition-colors duration-150 ${
            isPreset ? "border-border text-muted hover:text-ink" : "border-ink text-ink"
          }`}
        >
          <span
            aria-hidden
            className="h-5 w-5 shrink-0 rounded-full border border-border"
            style={{ background: isPreset ? "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" : hex }}
          />
          Otro color
        </button>
        {/* Input nativo invisible con estilo en línea: no depende de que cargue el CSS */}
        <input
          ref={pickerRef}
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          tabIndex={-1}
          aria-hidden
          style={{ position: "absolute", left: 0, bottom: 0, width: 1, height: 1, opacity: 0, border: 0, padding: 0, pointerEvents: "none" }}
        />
      </div>

      {/* Vista previa con texto blanco, como lo verán los botones de la landing */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className="inline-flex h-10 items-center rounded-(--radius-control) px-4 text-sm font-semibold text-white"
          style={{ background: hex }}
        >
          Consultar mi vehículo
        </span>
        <span className="text-xs text-muted">Así se ven los botones de tu landing.</span>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Da identidad a tu landing y a la página de seguimiento de tus clientes. Si eliges un color muy claro, lo
        oscurecemos un poco para que el texto se lea.
      </p>
    </fieldset>
  );
}

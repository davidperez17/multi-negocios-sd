"use client";

import { Copy, Plus, X } from "lucide-react";
import { validateWeeklyHours, WEEKDAY_NAMES, type Range, type Weekday, type WeeklyHours } from "@/lib/hours";

const WEEK_FROM_MONDAY: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 cursor-pointer ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const timeCls = "h-10 rounded-(--radius-control) border border-border bg-bg px-2 text-sm [font-variant-numeric:tabular-nums]";

// Horario por día con hasta dos tramos. Apagado = sin horario por día (la landing no muestra "Abierto ahora").
export function HoursEditor({
  enabled,
  hours,
  onEnabledChange,
  onHoursChange,
  defaults,
}: {
  enabled: boolean;
  hours: WeeklyHours;
  onEnabledChange: (v: boolean) => void;
  onHoursChange: (h: WeeklyHours) => void;
  defaults: WeeklyHours;
}) {
  const setDay = (d: Weekday, ranges: Range[]) => onHoursChange({ ...hours, [d]: ranges });
  const invalid = enabled && !validateWeeklyHours(hours);

  function addBreak(d: Weekday) {
    const [open, close] = hours[d][0];
    // Partir el día en mañana y tarde; si no cabe el mediodía típico, que el dueño ajuste
    const fits = open < "12:00" && close > "14:00";
    setDay(d, fits ? [[open, "12:00"], ["14:00", close]] : [[open, close], [close, close]]);
  }

  function copyMonday() {
    const next = { ...hours };
    for (const d of WEEK_FROM_MONDAY) if (d !== 1 && next[d].length > 0) next[d] = hours[1].map((r) => [...r] as Range);
    onHoursChange(next);
  }

  return (
    <fieldset className="rounded-(--radius-card) border border-border p-4 sm:p-5">
      <legend className="sr-only">Horario</legend>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Horario</p>
          <p className="mt-0.5 text-sm text-muted">Con esto tu página muestra &quot;Abierto ahora&quot; o &quot;Cerrado&quot;.</p>
        </div>
        <Switch
          checked={enabled}
          label="Usar horario por día"
          onChange={(v) => {
            onEnabledChange(v);
            if (v) onHoursChange(defaults);
          }}
        />
      </div>

      {enabled ? (
        <>
          <ul className="mt-4 divide-y divide-border">
            {WEEK_FROM_MONDAY.map((d) => {
              const ranges = hours[d];
              const open = ranges.length > 0;
              return (
                <li key={d} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                  <span className="w-24 font-medium">{capitalize(WEEKDAY_NAMES[d])}</span>
                  <Switch
                    checked={open}
                    label={`${capitalize(WEEKDAY_NAMES[d])} abierto`}
                    onChange={(v) => {
                      // Al abrir un día se propone el horario del lunes (o 8–18 si el lunes está cerrado)
                      const base: Range = hours[1][0] ?? ["08:00", "18:00"];
                      setDay(d, v ? [[base[0], base[1]]] : []);
                    }}
                  />
                  {!open && <span className="text-sm text-muted">Cerrado</span>}
                  {open && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      {ranges.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="time"
                            step={900}
                            value={r[0]}
                            aria-label={`${capitalize(WEEKDAY_NAMES[d])}, abre${ranges.length > 1 ? ` (tramo ${i + 1})` : ""}`}
                            onChange={(e) => setDay(d, ranges.map((x, j) => (j === i ? [e.target.value, x[1]] : x)) as Range[])}
                            className={timeCls}
                          />
                          <span aria-hidden>–</span>
                          <input
                            type="time"
                            step={900}
                            value={r[1]}
                            aria-label={`${capitalize(WEEKDAY_NAMES[d])}, cierra${ranges.length > 1 ? ` (tramo ${i + 1})` : ""}`}
                            onChange={(e) => setDay(d, ranges.map((x, j) => (j === i ? [x[0], e.target.value] : x)) as Range[])}
                            className={timeCls}
                          />
                          {i === 1 && (
                            <button
                              type="button"
                              onClick={() => setDay(d, [[ranges[0][0], ranges[1][1]]])}
                              aria-label={`Quitar cierre al mediodía del ${WEEKDAY_NAMES[d]}`}
                              className="flex h-10 w-10 items-center justify-center rounded-(--radius-control) text-muted hover:text-ink cursor-pointer"
                            >
                              <X size={16} aria-hidden />
                            </button>
                          )}
                        </div>
                      ))}
                      {ranges.length === 1 && (
                        <button
                          type="button"
                          onClick={() => addBreak(d)}
                          className="inline-flex h-9 items-center gap-1.5 self-start text-sm font-medium text-primary cursor-pointer"
                        >
                          <Plus size={15} aria-hidden />
                          Agregar cierre al mediodía
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={copyMonday}
            disabled={hours[1].length === 0}
            className="mt-3 inline-flex h-10 items-center gap-2 text-sm font-semibold text-primary cursor-pointer disabled:text-muted disabled:cursor-not-allowed"
          >
            <Copy size={15} aria-hidden />
            Copiar el horario del lunes a toda la semana
          </button>
          {invalid && (
            <p role="alert" className="mt-2 text-sm text-danger">
              Revisa las horas: cada tramo debe abrir antes de cerrar y la tarde debe empezar después de la mañana.
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Apagado: tu página no muestra si estás abierto. Enciéndelo para configurar tu horario de cada día.
        </p>
      )}
    </fieldset>
  );
}

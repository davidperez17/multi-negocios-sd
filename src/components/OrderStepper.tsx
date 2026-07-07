import { Check } from "lucide-react";
import { ORDER_STATUSES, STATUS_LABELS, statusIndex } from "@/lib/status";

/**
 * Stepper del recorrido de una orden. Vertical en móvil, horizontal en sm+.
 * `accent` permite que la página pública use el color del tenant.
 */
export function OrderStepper({ status }: { status: string }) {
  const current = statusIndex(status);
  const cancelled = status === "CANCELLED";

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0" aria-label="Progreso de la orden">
      {ORDER_STATUSES.map((s, i) => {
        const done = current > i || status === "DELIVERED";
        const active = current === i && !cancelled;
        const last = i === ORDER_STATUSES.length - 1;
        return (
          <li
            key={s}
            aria-current={active ? "step" : undefined}
            className="relative flex sm:flex-1 sm:flex-col items-start sm:items-center gap-3 sm:gap-2 pb-6 sm:pb-0 last:pb-0"
          >
            {/* Conector */}
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 sm:left-1/2 sm:top-[13px] sm:h-0.5 sm:w-full ${
                  done && !active ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-200 ${
                done
                  ? "border-primary bg-primary text-white"
                  : active
                    ? "border-primary bg-bg text-primary"
                    : "border-border bg-bg text-muted"
              }`}
            >
              {done ? <Check size={14} aria-hidden /> : i + 1}
            </span>
            <span
              className={`text-sm sm:text-xs sm:text-center leading-tight ${
                active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted"
              }`}
            >
              {STATUS_LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

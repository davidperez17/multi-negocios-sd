import { formatCents } from "@/lib/format";
import { ITEM_KIND_LABELS, type ItemKind } from "@/lib/status";

type Item = {
  id: string;
  kind: string;
  description: string;
  quantity: number;
  unitCents: number;
};

export function CostTable({ items, emptyText }: { items: Item[]; emptyText?: string }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-4">
        {emptyText ?? "Aún no hay conceptos registrados en esta orden."}
      </p>
    );
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitCents, 0);

  return (
    <>
      {/* Móvil: lista apilada, sin scroll horizontal */}
      <ul className="sm:hidden [font-variant-numeric:tabular-nums]">
        {items.map((it) => (
          <li key={it.id} className="flex items-start justify-between gap-4 border-b border-border/60 py-3">
            <div className="min-w-0">
              <p className="text-sm leading-snug">{it.description}</p>
              <p className="mt-0.5 text-xs text-muted">
                {ITEM_KIND_LABELS[it.kind as ItemKind] ?? it.kind}
                {" · "}
                {it.quantity} × {formatCents(it.unitCents)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium whitespace-nowrap">
              {formatCents(it.quantity * it.unitCents)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 py-3">
          <span className="font-semibold">Total</span>
          <span className="text-base font-bold whitespace-nowrap">{formatCents(total)}</span>
        </li>
      </ul>

      {/* sm+: tabla completa */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm [font-variant-numeric:tabular-nums]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="py-2 pr-3 font-medium">Concepto</th>
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 font-medium text-right">Cant.</th>
              <th className="py-2 pr-3 font-medium text-right">Precio unit.</th>
              <th className="py-2 font-medium text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border/60">
                <td className="py-2.5 pr-3">{it.description}</td>
                <td className="py-2.5 pr-3 text-muted">
                  {ITEM_KIND_LABELS[it.kind as ItemKind] ?? it.kind}
                </td>
                <td className="py-2.5 pr-3 text-right">{it.quantity}</td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap">{formatCents(it.unitCents)}</td>
                <td className="py-2.5 text-right font-medium whitespace-nowrap">
                  {formatCents(it.quantity * it.unitCents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-3 pr-3 text-right font-semibold">
                Total
              </td>
              <td className="py-3 text-right text-base font-bold">{formatCents(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

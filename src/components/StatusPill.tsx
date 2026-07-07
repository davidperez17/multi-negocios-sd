import {
  Inbox,
  Stethoscope,
  FileClock,
  Wrench,
  ShieldCheck,
  BellRing,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { STATUS_LABELS, type OrderStatus } from "@/lib/status";

const STATUS_STYLES: Record<OrderStatus, { icon: LucideIcon; className: string }> = {
  RECEIVED: { icon: Inbox, className: "bg-surface-2 text-ink" },
  DIAGNOSIS: { icon: Stethoscope, className: "bg-status-progress text-white" },
  WAITING_APPROVAL: { icon: FileClock, className: "bg-status-waiting text-ink" },
  IN_REPAIR: { icon: Wrench, className: "bg-status-progress text-white" },
  QUALITY_CHECK: { icon: ShieldCheck, className: "bg-status-progress text-white" },
  READY: { icon: BellRing, className: "bg-status-ready text-white" },
  DELIVERED: { icon: CheckCircle2, className: "bg-surface-2 text-muted" },
  CANCELLED: { icon: XCircle, className: "bg-danger text-white" },
};

export function StatusPill({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const style = STATUS_STYLES[status as OrderStatus] ?? STATUS_STYLES.RECEIVED;
  const Icon = style.icon;
  const label = STATUS_LABELS[status as OrderStatus] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${style.className} ${
        size === "md" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <Icon size={size === "md" ? 16 : 12} aria-hidden />
      {label}
    </span>
  );
}

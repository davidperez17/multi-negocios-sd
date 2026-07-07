import { Car, Bike, Truck } from "lucide-react";
import type { VehicleType } from "@/lib/status";

export function VehicleTypeIcon({
  type,
  size = 16,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Icon = type === "MOTORCYCLE" ? Bike : type === "TRUCK" ? Truck : Car;
  return <Icon size={size} className={className} aria-hidden />;
}

export function vehicleLabel(v: { brand: string; model: string; year?: number | null }) {
  return `${v.brand} ${v.model}${v.year ? ` ${v.year}` : ""}`;
}

export type { VehicleType };

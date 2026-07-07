"use client";

import { useState } from "react";
import { createOrder } from "../../../actions";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "@/lib/status";

export type CustomerOption = {
  id: string;
  name: string;
  phone: string;
  vehicles: { id: string; label: string; plate: string }[];
};

const inputCls =
  "w-full h-11 rounded-(--radius-control) border border-border bg-bg px-3.5 placeholder:text-muted";
const labelCls = "block text-sm font-medium mb-1.5";

export function NewOrderForm({ customers, error }: { customers: CustomerOption[]; error?: string }) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const selected = customers.find((c) => c.id === customerId);

  return (
    <form action={createOrder} className="mt-8 max-w-2xl space-y-10">
      {/* Cliente */}
      <fieldset>
        <legend className="font-semibold mb-4">Cliente</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerId" className={labelCls}>
              Cliente registrado
            </label>
            <select
              id="customerId"
              name="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
              }}
              className={inputCls}
            >
              <option value="">— Cliente nuevo —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </div>
          {!customerId && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customerName" className={labelCls}>
                  Nombre <span aria-hidden className="text-danger">*</span>
                </label>
                <input id="customerName" name="customerName" required={!customerId} className={inputCls} placeholder="Nombre y apellido" />
              </div>
              <div>
                <label htmlFor="customerPhone" className={labelCls}>
                  Teléfono <span aria-hidden className="text-danger">*</span>
                </label>
                <input id="customerPhone" name="customerPhone" type="tel" required={!customerId} className={inputCls} placeholder="555 000 0000" />
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Vehículo */}
      <fieldset>
        <legend className="font-semibold mb-4">Vehículo</legend>
        <div className="space-y-4">
          {selected && selected.vehicles.length > 0 && (
            <div>
              <label htmlFor="vehicleId" className={labelCls}>
                Vehículo registrado
              </label>
              <select
                id="vehicleId"
                name="vehicleId"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Vehículo nuevo —</option>
                {selected.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} · {v.plate}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!vehicleId && (
            <>
              <div>
                <label htmlFor="vehicleType" className={labelCls}>
                  Tipo
                </label>
                <select id="vehicleType" name="vehicleType" className={inputCls}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {VEHICLE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="brand" className={labelCls}>
                    Marca <span aria-hidden className="text-danger">*</span>
                  </label>
                  <input id="brand" name="brand" required={!vehicleId} className={inputCls} placeholder="Mazda" />
                </div>
                <div>
                  <label htmlFor="model" className={labelCls}>
                    Modelo <span aria-hidden className="text-danger">*</span>
                  </label>
                  <input id="model" name="model" required={!vehicleId} className={inputCls} placeholder="CX-5" />
                </div>
                <div>
                  <label htmlFor="year" className={labelCls}>
                    Año
                  </label>
                  <input id="year" name="year" type="number" min={1950} max={2100} className={inputCls} placeholder="2021" />
                </div>
                <div>
                  <label htmlFor="plate" className={labelCls}>
                    Placa <span aria-hidden className="text-danger">*</span>
                  </label>
                  <input id="plate" name="plate" required={!vehicleId} className={`${inputCls} uppercase`} placeholder="ABC-123" />
                </div>
              </div>
            </>
          )}
        </div>
      </fieldset>

      {/* Orden */}
      <fieldset>
        <legend className="font-semibold mb-4">Orden de servicio</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="concern" className={labelCls}>
              Motivo de ingreso / falla reportada <span aria-hidden className="text-danger">*</span>
            </label>
            <textarea
              id="concern"
              name="concern"
              required
              rows={3}
              className="w-full rounded-(--radius-control) border border-border bg-bg px-3.5 py-2.5 placeholder:text-muted"
              placeholder="Ej. ruido al frenar, servicio de 10,000 km…"
            />
          </div>
          <div>
            <label htmlFor="estimatedAt" className={labelCls}>
              Entrega estimada
            </label>
            <input id="estimatedAt" name="estimatedAt" type="date" className={`${inputCls} max-w-52`} />
            <p className="mt-1.5 text-xs text-muted">Opcional. El cliente la verá en su página de seguimiento.</p>
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          Faltan datos obligatorios. Revisa cliente, vehículo y motivo de ingreso.
        </p>
      )}

      <button
        type="submit"
        className="h-11 rounded-(--radius-control) bg-primary px-6 font-semibold text-white hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
      >
        Crear orden
      </button>
    </form>
  );
}

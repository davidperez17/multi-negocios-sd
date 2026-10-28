import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { addItem, changeStatus, createOrder, deleteItem, DomainError } from "@/lib/orders";
import { makeTenantWithOrder, resetDb } from "./helpers";

beforeEach(resetDb);

const newVehicle = { type: "CAR", brand: "Mazda", model: "3", year: 2019, plate: "P-555XYZ" };

describe("createOrder: aislamiento por tenant", () => {
  it("rechaza un customerId de otro tenant", async () => {
    const a = await makeTenantWithOrder();
    const b = await makeTenantWithOrder();
    await expect(
      createOrder(a.tenant.id, { customerId: b.customer.id, vehicle: newVehicle, concern: "x", estimatedAt: null })
    ).rejects.toThrow(new DomainError("customer_not_found"));
    expect(await prisma.vehicle.count({ where: { customerId: b.customer.id } })).toBe(1);
  });

  it("rechaza un vehicleId de otro tenant", async () => {
    const a = await makeTenantWithOrder();
    const b = await makeTenantWithOrder();
    await expect(
      createOrder(a.tenant.id, { customerId: a.customer.id, vehicleId: b.vehicle.id, concern: "x", estimatedAt: null })
    ).rejects.toThrow(new DomainError("vehicle_not_found"));
  });

  it("rechaza un vehículo que es de otro cliente del mismo tenant", async () => {
    const a = await makeTenantWithOrder();
    const other = await prisma.customer.create({ data: { tenantId: a.tenant.id, name: "Luis", phone: "1" } });
    await expect(
      createOrder(a.tenant.id, { customerId: other.id, vehicleId: a.vehicle.id, concern: "x", estimatedAt: null })
    ).rejects.toThrow(new DomainError("vehicle_not_found"));
  });

  it("no deja cliente huérfano si falla la creación del vehículo", async () => {
    const a = await makeTenantWithOrder();
    await expect(
      createOrder(a.tenant.id, {
        customer: { name: "Nuevo", phone: "2" },
        vehicleId: "no-existe",
        concern: "x",
        estimatedAt: null,
      })
    ).rejects.toThrow();
    expect(await prisma.customer.count({ where: { tenantId: a.tenant.id } })).toBe(1);
  });

  it("crea cliente, vehículo y orden con códigos válidos", async () => {
    const a = await makeTenantWithOrder();
    const { id } = await createOrder(a.tenant.id, {
      customer: { name: "Nuevo", phone: "2" },
      vehicle: newVehicle,
      concern: "Cambio de aceite",
      estimatedAt: null,
    });
    const order = await prisma.workOrder.findUniqueOrThrow({ where: { id }, include: { vehicle: true } });
    expect(order.tenantId).toBe(a.tenant.id);
    expect(order.vehicle.tenantId).toBe(a.tenant.id);
    expect(order.trackingCode).toMatch(/^TX-[A-Z2-9]{6}$/);
    expect(order.costCode).toMatch(/^\d{5}$/);
  });
});

describe("presupuesto aprobado se invalida al cambiar", () => {
  async function approved() {
    const ctx = await makeTenantWithOrder({ status: "IN_REPAIR" });
    await prisma.workOrderItem.create({
      data: { workOrderId: ctx.order.id, kind: "PART", description: "Pastillas", unitCents: 50000 },
    });
    await prisma.workOrder.update({
      where: { id: ctx.order.id },
      data: { approvedAt: new Date(), approvedTotalCents: 50000 },
    });
    return ctx;
  }

  it("addItem borra la aprobación y regresa a WAITING_APPROVAL", async () => {
    const { tenant, order } = await approved();
    await addItem(tenant.id, order.id, { kind: "PART", description: "Disco", quantity: 1, unitCents: 90000 });
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.approvedAt).toBeNull();
    expect(after.approvedTotalCents).toBeNull();
    expect(after.status).toBe("WAITING_APPROVAL");
    const last = await prisma.progressUpdate.findFirst({ where: { workOrderId: order.id }, orderBy: { createdAt: "desc" } });
    expect(last?.message).toMatch(/nueva aprobación/);
  });

  it("deleteItem borra la aprobación", async () => {
    const { tenant, order } = await approved();
    const item = await prisma.workOrderItem.findFirstOrThrow({ where: { workOrderId: order.id } });
    await deleteItem(tenant.id, item.id);
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.approvedAt).toBeNull();
  });

  it("addItem en orden de otro tenant no hace nada", async () => {
    const a = await approved();
    const b = await makeTenantWithOrder();
    await expect(
      addItem(b.tenant.id, a.order.id, { kind: "PART", description: "Disco", quantity: 1, unitCents: 1 })
    ).rejects.toThrow(new DomainError("order_not_found"));
    expect(await prisma.workOrderItem.count({ where: { workOrderId: a.order.id } })).toBe(1);
  });
});

describe("changeStatus", () => {
  it("rechaza si el formulario está desactualizado (fromStatus distinto)", async () => {
    const { tenant, order } = await makeTenantWithOrder({ status: "IN_REPAIR" });
    await expect(changeStatus(tenant.id, order.id, "READY", { fromStatus: "DIAGNOSIS" })).rejects.toThrow(
      new DomainError("stale_status")
    );
  });

  it("volver a WAITING_APPROVAL limpia la aprobación previa", async () => {
    const { tenant, order } = await makeTenantWithOrder({ status: "IN_REPAIR" });
    await prisma.workOrder.update({ where: { id: order.id }, data: { approvedAt: new Date(), approvedTotalCents: 1 } });
    await changeStatus(tenant.id, order.id, "WAITING_APPROVAL", { fromStatus: "IN_REPAIR" });
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.approvedAt).toBeNull();
    expect(after.approvedTotalCents).toBeNull();
  });

  it("salir de DELIVERED limpia deliveredAt", async () => {
    const { tenant, order } = await makeTenantWithOrder({ status: "DELIVERED" });
    await prisma.workOrder.update({ where: { id: order.id }, data: { deliveredAt: new Date() } });
    await changeStatus(tenant.id, order.id, "READY", { fromStatus: "DELIVERED" });
    const after = await prisma.workOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.deliveredAt).toBeNull();
  });

  it("rechaza estados desconocidos", async () => {
    const { tenant, order } = await makeTenantWithOrder();
    await expect(changeStatus(tenant.id, order.id, "HACKED", {})).rejects.toThrow(new DomainError("invalid_status"));
  });
});

describe("integridad referencial", () => {
  it("no permite borrar un cliente con órdenes (preserva historial)", async () => {
    const { customer } = await makeTenantWithOrder();
    await expect(prisma.customer.delete({ where: { id: customer.id } })).rejects.toThrow();
  });

  it("borrar el tenant completo sigue funcionando", async () => {
    const { tenant } = await makeTenantWithOrder();
    await prisma.tenant.delete({ where: { id: tenant.id } });
    expect(await prisma.workOrder.count()).toBe(0);
  });
});

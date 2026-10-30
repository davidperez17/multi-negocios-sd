import { prisma } from "@/lib/prisma";

/** Vacía la DB de pruebas. Tenant en cascada arrastra el resto. */
export async function resetDb() {
  await prisma.progressUpdate.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

let seq = 0;

/** Crea un tenant con un cliente, un vehículo y una orden lista para probar. */
export async function makeTenantWithOrder(overrides: { status?: string } = {}) {
  seq++;
  const tenant = await prisma.tenant.create({ data: { slug: `t-${seq}`, name: `Taller ${seq}` } });
  const customer = await prisma.customer.create({
    data: { tenantId: tenant.id, name: "Ana Cortés", phone: "5555 0000" },
  });
  const vehicle = await prisma.vehicle.create({
    data: { tenantId: tenant.id, customerId: customer.id, type: "CAR", brand: "Toyota", model: "Corolla", plate: `P-${100 + seq}ABC` },
  });
  const order = await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      trackingCode: `TX-T${String(seq).padStart(5, "0")}`,
      costCode: "12345",
      concern: "Ruido en frenos",
      status: overrides.status ?? "WAITING_APPROVAL",
    },
  });
  return { tenant, customer, vehicle, order };
}

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000);
}
// Lunes a viernes de 8 a 12 y de 2 a 6
const SPLIT_DAY = [
  ["08:00", "12:00"],
  ["14:00", "18:00"],
];

function daysFromNow(d: number) {
  return new Date(Date.now() + d * 86400_000);
}

async function main() {
  // El seed borra todos los tenants: nunca contra una base de producción
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    throw new Error("db:seed borra todos los datos. En producción requiere SEED_FORCE=1.");
  }
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ── Tenant 1: Taller Rodríguez (carros y camiones) ──────────────
  const rodriguez = await prisma.tenant.create({
    data: {
      slug: "taller-rodriguez",
      name: "Taller Rodríguez",
      tagline: "Mecánica de confianza desde 1998",
      description:
        "Especialistas en motor, transmisión y suspensión para carros y camiones. Diagnóstico computarizado y repuestos originales.",
      phone: "2447 8890",
      whatsapp: "50255214477",
      email: "contacto@tallerrodriguez.gt",
      address: "Avenida Petapa 45-12, Zona 12",
      city: "Ciudad de Guatemala",
      brandColor: "oklch(0.5 0.16 250)",
      vehicleTypes: "CAR,TRUCK",
      services:
        "Diagnóstico computarizado\nAfinación mayor y menor\nFrenos y suspensión\nTransmisión y clutch\nSistema eléctrico\nAire acondicionado",
      schedule: "Lun-Vie 8:00-18:00 · Sáb 8:00-14:00",
      // Landing personalizable: horario con cierre al mediodía y año de apertura
      heroStyle: "GRADIENT",
      foundedYear: 1998,
      weeklyHours: JSON.stringify({
        0: [],
        1: SPLIT_DAY,
        2: SPLIT_DAY,
        3: SPLIT_DAY,
        4: SPLIT_DAY,
        5: SPLIT_DAY,
        6: [["08:00", "13:00"]],
      }),
      users: {
        create: [
          { name: "Marco Rodríguez", email: "marco@tallerrodriguez.gt", passwordHash, role: "ADMIN" },
          { name: "Julia Peña", email: "julia@tallerrodriguez.gt", passwordHash, role: "STAFF" },
        ],
      },
    },
  });

  const ana = await prisma.customer.create({
    data: {
      tenantId: rodriguez.id,
      name: "Ana Cortés",
      phone: "5589 2234",
      email: "ana.cortes@gmail.com",
    },
  });
  const anaCar = await prisma.vehicle.create({
    data: {
      tenantId: rodriguez.id,
      customerId: ana.id,
      type: "CAR",
      brand: "Mazda",
      model: "CX-5",
      year: 2021,
      plate: "P-402JKL",
      color: "Rojo",
    },
  });

  const luis = await prisma.customer.create({
    data: {
      tenantId: rodriguez.id,
      name: "Luis Herrera",
      phone: "4477 0912",
    },
  });
  const luisTruck = await prisma.vehicle.create({
    data: {
      tenantId: rodriguez.id,
      customerId: luis.id,
      type: "TRUCK",
      brand: "Freightliner",
      model: "Cascadia",
      year: 2018,
      plate: "C-882XCB",
      color: "Blanco",
    },
  });

  // Orden en reparación con historial completo — la demo principal
  await prisma.workOrder.create({
    data: {
      tenantId: rodriguez.id,
      customerId: ana.id,
      vehicleId: anaCar.id,
      trackingCode: "TX-DEMO01",
      costCode: "73914",
      concern: "Ruido metálico al frenar y vibración en el volante a más de 80 km/h",
      diagnosis:
        "Balatas delanteras al 10%, discos con desgaste irregular. Rótula inferior izquierda con juego.",
      status: "IN_REPAIR",
      estimatedAt: daysFromNow(1),
      createdAt: hoursAgo(30),
      approvedAt: hoursAgo(22),
      items: {
        create: [
          { kind: "LABOR", description: "Diagnóstico de frenos y suspensión", quantity: 1, unitCents: 35000 },
          { kind: "PART", description: "Juego de balatas delanteras (cerámica)", quantity: 1, unitCents: 95000 },
          { kind: "PART", description: "Disco de freno delantero", quantity: 2, unitCents: 70000 },
          { kind: "PART", description: "Rótula inferior izquierda", quantity: 1, unitCents: 50000 },
          { kind: "LABOR", description: "Cambio de balatas, discos y rótula", quantity: 1, unitCents: 85000 },
        ],
      },
      updates: {
        create: [
          {
            message: "Vehículo recibido. Ingresa a cola de diagnóstico.",
            status: "RECEIVED",
            createdAt: hoursAgo(30),
          },
          {
            message:
              "Diagnóstico terminado: balatas y discos delanteros desgastados, rótula inferior izquierda con juego. Enviamos presupuesto.",
            status: "DIAGNOSIS",
            createdAt: hoursAgo(26),
          },
          {
            message: "Presupuesto aprobado por la clienta. Pedimos repuestos.",
            status: "WAITING_APPROVAL",
            createdAt: hoursAgo(22),
          },
          {
            message: "Repuestos recibidos. Iniciamos cambio de discos y balatas.",
            status: "IN_REPAIR",
            photoUrl: "/uploads/demo/frenos-avance.svg",
            createdAt: hoursAgo(4),
          },
        ],
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: rodriguez.id,
      customerId: luis.id,
      vehicleId: luisTruck.id,
      trackingCode: "TX-KM42PQ",
      costCode: "28450",
      concern: "Pérdida de potencia en subidas, humo negro en el escape",
      status: "WAITING_APPROVAL",
      createdAt: hoursAgo(8),
      diagnosis: "Inyectores sucios y filtro de aire saturado. Se recomienda servicio de inyección completo.",
      items: {
        create: [
          { kind: "LABOR", description: "Diagnóstico de motor diésel", quantity: 1, unitCents: 60000 },
          { kind: "LABOR", description: "Servicio de limpieza de inyectores", quantity: 6, unitCents: 25000 },
          { kind: "PART", description: "Filtro de aire", quantity: 1, unitCents: 40000 },
        ],
      },
      updates: {
        create: [
          { message: "Camión recibido en patio. En cola de diagnóstico.", status: "RECEIVED", createdAt: hoursAgo(8) },
          {
            message: "Diagnóstico listo: inyectores sucios y filtro saturado. Presupuesto enviado por WhatsApp.",
            status: "DIAGNOSIS",
            createdAt: hoursAgo(3),
          },
        ],
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: rodriguez.id,
      customerId: ana.id,
      vehicleId: anaCar.id,
      trackingCode: "TX-9FH3WD",
      costCode: "91062",
      concern: "Servicio de afinación mayor 60,000 km",
      status: "DELIVERED",
      createdAt: hoursAgo(24 * 40),
      deliveredAt: hoursAgo(24 * 38),
      items: {
        create: [
          { kind: "LABOR", description: "Afinación mayor", quantity: 1, unitCents: 135000 },
          { kind: "PART", description: "Kit de bujías iridium", quantity: 1, unitCents: 70000 },
        ],
      },
      updates: {
        create: [
          { message: "Vehículo recibido.", status: "RECEIVED", createdAt: hoursAgo(24 * 40) },
          { message: "Afinación completada y verificada.", status: "READY", createdAt: hoursAgo(24 * 38 - 2) },
          { message: "Vehículo entregado a la clienta.", status: "DELIVERED", createdAt: hoursAgo(24 * 38) },
        ],
      },
    },
  });

  // ── Tenant 2: MotoGarage Vélez (motos) ──────────────────────────
  const velez = await prisma.tenant.create({
    data: {
      slug: "motogarage-velez",
      name: "MotoGarage Vélez",
      tagline: "Tu moto en manos expertas",
      description:
        "Taller especializado en motocicletas: mantenimiento, performance y restauración. Atendemos todas las marcas.",
      phone: "2364 0882",
      whatsapp: "50256408823",
      email: "hola@motogaragevelez.gt",
      address: "6a Avenida 8-24, Zona 1",
      city: "Ciudad de Guatemala",
      brandColor: "oklch(0.55 0.15 150)",
      vehicleTypes: "MOTORCYCLE",
      services:
        "Servicio general\nCambio de llantas\nCarburación e inyección\nFrenos y suspensión\nPreparación para ruta",
      // Sin horario por día: muestra el texto libre (talleres que aún no lo configuran)
      schedule: "Mar-Sáb 9:00-19:00",
      heroStyle: "DOTS",
      users: {
        create: [
          { name: "Camila Vélez", email: "camila@motogaragevelez.gt", passwordHash, role: "ADMIN" },
        ],
      },
    },
  });

  const diego = await prisma.customer.create({
    data: {
      tenantId: velez.id,
      name: "Diego Fuentes",
      phone: "5530 2556",
      email: "diegof@hotmail.com",
    },
  });
  const diegoMoto = await prisma.vehicle.create({
    data: {
      tenantId: velez.id,
      customerId: diego.id,
      type: "MOTORCYCLE",
      brand: "Yamaha",
      model: "MT-07",
      year: 2023,
      plate: "M-884KDT",
      color: "Azul",
    },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: velez.id,
      customerId: diego.id,
      vehicleId: diegoMoto.id,
      trackingCode: "TX-MOTO22",
      costCode: "46137",
      concern: "Servicio de 10,000 km + cambio de llanta trasera",
      status: "QUALITY_CHECK",
      estimatedAt: daysFromNow(0),
      createdAt: hoursAgo(10),
      items: {
        create: [
          { kind: "LABOR", description: "Servicio general 10,000 km", quantity: 1, unitCents: 75000 },
          { kind: "PART", description: "Llanta trasera Michelin Road 6", quantity: 1, unitCents: 240000 },
          { kind: "LABOR", description: "Montaje y balanceo", quantity: 1, unitCents: 20000 },
        ],
      },
      updates: {
        create: [
          { message: "Moto recibida. Iniciamos servicio.", status: "RECEIVED", createdAt: hoursAgo(10) },
          { message: "Servicio general completado. Montando llanta nueva.", status: "IN_REPAIR", createdAt: hoursAgo(5) },
          {
            message: "Llanta montada y balanceada. Prueba de ruta en curso.",
            status: "QUALITY_CHECK",
            createdAt: hoursAgo(1),
          },
        ],
      },
    },
  });

  console.log("Seed listo:");
  console.log("  Tenants: taller-rodriguez, motogarage-velez");
  console.log("  Admin 1: marco@tallerrodriguez.gt / demo1234");
  console.log("  Admin 2: camila@motogaragevelez.gt / demo1234");
  console.log("  Tracking demo: TX-DEMO01 (taller-rodriguez) · PIN costos: 73914");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

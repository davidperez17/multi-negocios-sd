"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { generateTrackingCode, generateCostCode } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/status";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

// ── Sesión ────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/admin/login?error=1");
  }
  await createSession(user.id, user.tenantId);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ── Órdenes ───────────────────────────────────────────────────────

export async function createOrder(formData: FormData) {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const customerId = String(formData.get("customerId") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicleType = String(formData.get("vehicleType") ?? "CAR");
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();

  const concern = String(formData.get("concern") ?? "").trim();
  const estimatedAtRaw = String(formData.get("estimatedAt") ?? "").trim();

  if (!concern) redirect("/admin/ordenes/nueva?error=concern");

  let finalCustomerId = customerId;
  if (!finalCustomerId) {
    if (!customerName || !customerPhone) redirect("/admin/ordenes/nueva?error=customer");
    const customer = await prisma.customer.create({
      data: { tenantId, name: customerName, phone: customerPhone },
    });
    finalCustomerId = customer.id;
  }

  let finalVehicleId = vehicleId;
  if (!finalVehicleId) {
    if (!brand || !model || !plate) redirect("/admin/ordenes/nueva?error=vehicle");
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId: finalCustomerId,
        type: vehicleType,
        brand,
        model,
        year: yearRaw ? Number(yearRaw) : null,
        plate,
      },
    });
    finalVehicleId = vehicle.id;
  }

  // Reintenta si el código aleatorio colisiona (unique)
  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await prisma.workOrder.create({
        data: {
          tenantId,
          customerId: finalCustomerId,
          vehicleId: finalVehicleId,
          trackingCode: generateTrackingCode(),
          costCode: generateCostCode(),
          concern,
          estimatedAt: estimatedAtRaw ? new Date(estimatedAtRaw) : null,
          updates: {
            create: {
              message: "Vehículo recibido. Ingresa a cola de diagnóstico.",
              status: "RECEIVED",
            },
          },
        },
      });
    } catch {
      if (attempt === 2) throw new Error("No se pudo generar un código de seguimiento único");
    }
  }

  revalidatePath("/admin");
  redirect(`/admin/ordenes/${order!.id}`);
}

export async function setOrderStatus(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const message = String(formData.get("message") ?? "").trim();

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) && status !== "CANCELLED") {
    return;
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: orderId, tenantId: user.tenantId },
  });
  if (!order) return;

  await prisma.workOrder.update({
    where: { id: orderId },
    data: {
      status,
      deliveredAt: status === "DELIVERED" ? new Date() : order.deliveredAt,
      updates: {
        create: {
          message: message || `Estado actualizado: ${STATUS_LABELS[status]}.`,
          status,
        },
      },
    },
  });

  revalidatePath(`/admin/ordenes/${orderId}`);
  revalidatePath("/admin");
}

// Tipos de imagen permitidos en fotos de avances
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function savePhoto(file: File, tenantId: string): Promise<string | null> {
  const ext = PHOTO_TYPES[file.type];
  if (!ext || file.size === 0 || file.size > PHOTO_MAX_BYTES) return null;
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${tenantId}/${name}`;
}

export async function publishUpdate(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const order = await prisma.workOrder.findFirst({
    where: { id: orderId, tenantId: user.tenantId },
  });
  if (!order) return;

  const photo = formData.get("photo");
  const photoUrl =
    photo instanceof File && photo.size > 0 ? await savePhoto(photo, user.tenantId) : null;

  await prisma.progressUpdate.create({
    data: { workOrderId: orderId, message, status: order.status, photoUrl },
  });

  revalidatePath(`/admin/ordenes/${orderId}`);
}

export async function saveDiagnosis(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const diagnosis = String(formData.get("diagnosis") ?? "").trim();

  await prisma.workOrder.updateMany({
    where: { id: orderId, tenantId: user.tenantId },
    data: { diagnosis: diagnosis || null },
  });
  revalidatePath(`/admin/ordenes/${orderId}`);
}

// ── Conceptos / costos ────────────────────────────────────────────

export async function addItem(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const kind = String(formData.get("kind") ?? "LABOR");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));

  if (!description || !Number.isFinite(price) || price <= 0) return;

  const order = await prisma.workOrder.findFirst({
    where: { id: orderId, tenantId: user.tenantId },
  });
  if (!order) return;

  await prisma.workOrderItem.create({
    data: {
      workOrderId: orderId,
      kind: kind === "PART" ? "PART" : "LABOR",
      description,
      quantity,
      unitCents: Math.round(price * 100),
    },
  });
  revalidatePath(`/admin/ordenes/${orderId}`);
}

export async function deleteItem(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const item = await prisma.workOrderItem.findUnique({
    where: { id: itemId },
    include: { workOrder: { select: { id: true, tenantId: true } } },
  });
  if (!item || item.workOrder.tenantId !== user.tenantId) return;

  await prisma.workOrderItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/ordenes/${item.workOrder.id}`);
}

// ── Clientes ──────────────────────────────────────────────────────

export async function createCustomer(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !phone) redirect("/admin/clientes?error=1");

  await prisma.customer.create({
    data: { tenantId: user.tenantId, name, phone, email: email || null },
  });
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// ── Ajustes del tenant ────────────────────────────────────────────

export async function updateTenantSettings(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin/ajustes?error=role");

  const fields = [
    "name",
    "tagline",
    "description",
    "phone",
    "whatsapp",
    "email",
    "address",
    "city",
    "schedule",
    "services",
    "brandColor",
  ] as const;

  const data: Record<string, string | null> = {};
  for (const f of fields) {
    const v = String(formData.get(f) ?? "").trim();
    data[f] = v || null;
  }
  // Nombre y color nunca vacíos
  if (!data.name) delete data.name;
  if (!data.brandColor) delete data.brandColor;

  const types = formData.getAll("vehicleTypes").map(String).filter(Boolean);
  if (types.length > 0) data.vehicleTypes = types.join(",");

  await prisma.tenant.update({ where: { id: user.tenantId }, data });
  revalidatePath("/admin/ajustes");
  revalidatePath(`/t/${user.tenant.slug}`);
  redirect("/admin/ajustes?saved=1");
}

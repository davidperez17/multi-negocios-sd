"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import {
  addItem as addItemToOrder,
  changeStatus,
  createOrder as createOrderForTenant,
  deleteItem as deleteItemFromOrder,
  DomainError,
  type CreateOrderInput,
} from "@/lib/orders";
import { savePhoto } from "@/lib/uploads";
import { authenticate } from "@/lib/login";
import { VEHICLE_TYPES } from "@/lib/status";
import {
  isValidBrandColor,
  normalizePlate,
  parseDateOnly,
  parseMoneyToCents,
  parseQuantity,
  parseYear,
} from "@/lib/validation";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

// ── Sesión ────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const result = await authenticate(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!result.ok) redirect(`/admin/login?error=${result.reason === "locked" ? "locked" : "1"}`);
  await createSession(result.user.id, result.user.tenantId);
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
  const field = (k: string) => String(formData.get(k) ?? "").trim();

  const customerId = field("customerId");
  const vehicleId = field("vehicleId");
  const concern = field("concern");
  if (!concern) redirect("/admin/ordenes/nueva?error=concern");

  const estimatedAt = parseDateOnly(field("estimatedAt"));
  if (estimatedAt === "invalid") redirect("/admin/ordenes/nueva?error=date");

  let customer: CreateOrderInput["customer"];
  if (!customerId) {
    const name = field("customerName");
    const phone = field("customerPhone");
    if (!name || !phone) redirect("/admin/ordenes/nueva?error=customer");
    customer = { name, phone };
  }

  let vehicle: CreateOrderInput["vehicle"];
  if (!vehicleId) {
    const brand = field("brand");
    const model = field("model");
    const plate = normalizePlate(field("plate"));
    const year = parseYear(field("year"));
    if (!brand || !model || !plate) redirect("/admin/ordenes/nueva?error=vehicle");
    if (year === "invalid") redirect("/admin/ordenes/nueva?error=year");
    vehicle = { type: field("vehicleType") || "CAR", brand, model, year, plate };
  }

  let order: { id: string };
  try {
    order = await createOrderForTenant(tenantId, {
      customerId: customerId || undefined,
      customer,
      vehicleId: vehicleId || undefined,
      vehicle,
      concern,
      estimatedAt,
    });
  } catch (e) {
    if (e instanceof DomainError) redirect(`/admin/ordenes/nueva?error=${e.code}`);
    throw e;
  }

  revalidatePath("/admin");
  redirect(`/admin/ordenes/${order.id}`);
}

export async function setOrderStatus(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  try {
    await changeStatus(user.tenantId, orderId, String(formData.get("status") ?? ""), {
      fromStatus: String(formData.get("fromStatus") ?? "") || undefined,
      message: String(formData.get("message") ?? "").trim(),
    });
  } catch (e) {
    if (e instanceof DomainError) redirect(`/admin/ordenes/${orderId}?error=${e.code}`);
    throw e;
  }

  revalidatePath(`/admin/ordenes/${orderId}`);
  revalidatePath("/admin");
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

  // Si viene foto y no es válida, no se publica el avance: el taller debe enterarse
  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    photoUrl = await savePhoto(photo, user.tenantId);
    if (!photoUrl) redirect(`/admin/ordenes/${orderId}?error=photo`);
  }

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
  const quantity = parseQuantity(String(formData.get("quantity") ?? ""));
  const unitCents = parseMoneyToCents(String(formData.get("price") ?? ""));
  if (quantity === null || unitCents === null) redirect(`/admin/ordenes/${orderId}?error=invalid_item`);

  try {
    await addItemToOrder(user.tenantId, orderId, {
      kind: String(formData.get("kind") ?? "LABOR"),
      description: String(formData.get("description") ?? ""),
      quantity,
      unitCents,
    });
  } catch (e) {
    if (e instanceof DomainError) redirect(`/admin/ordenes/${orderId}?error=${e.code}`);
    throw e;
  }
  revalidatePath(`/admin/ordenes/${orderId}`);
}

export async function deleteItem(formData: FormData) {
  const user = await requireUser();
  const orderId = await deleteItemFromOrder(user.tenantId, String(formData.get("itemId") ?? ""));
  if (orderId) revalidatePath(`/admin/ordenes/${orderId}`);
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
    // Tope de longitud: textos de landing, no documentos
    const v = String(formData.get(f) ?? "").trim().slice(0, 2000);
    data[f] = v || null;
  }
  // Nombre y color nunca vacíos
  if (!data.name) delete data.name;
  if (!data.brandColor) delete data.brandColor;
  // El color va a atributos style: solo oklch(), nada de CSS extra
  else if (!isValidBrandColor(data.brandColor)) redirect("/admin/ajustes?error=color");

  const types = formData
    .getAll("vehicleTypes")
    .map(String)
    .filter((t) => (VEHICLE_TYPES as readonly string[]).includes(t));
  if (types.length > 0) data.vehicleTypes = types.join(",");

  await prisma.tenant.update({ where: { id: user.tenantId }, data });
  revalidatePath("/admin/ajustes");
  revalidatePath(`/t/${user.tenant.slug}`);
  redirect("/admin/ajustes?saved=1");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { tenantAccess } from "./access";

const COOKIE_NAME = "taller_session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 días

/** En producción falla cerrado: sin secreto propio cualquiera podría firmar sesiones. */
export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres en producción");
    return s;
  }
  return s || "dev-secret-change-me";
}

type SessionPayload = { userId: string; tenantId: string; exp: number };

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, tenantId: string) {
  const token = encodeSession({
    userId,
    tenantId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/** Usuario de una sesión válida, o null si ya no existe, fue desactivado o cambió de taller. */
export async function sessionUser(session: SessionPayload) {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });
  if (!user || !user.active || user.tenantId !== session.tenantId) return null;
  return user;
}

/** Usuario autenticado con su tenant, o null. Para páginas del admin. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return sessionUser(session);
}

/**
 * Como getCurrentUser, pero redirige a login si no hay sesión y a la pantalla de plan
 * si la prueba o el pago vencieron. Para pages y server actions del panel.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (tenantAccess(user.tenant).state === "expired") redirect("/admin/plan");
  return user;
}

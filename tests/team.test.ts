import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/login";
import { DomainError } from "@/lib/orders";
import { registerWorkshop } from "@/lib/signup";
import { addWorker, resetWorkerPassword, setWorkerActive, setWorkerRole } from "@/lib/team";
import { resetDb } from "./helpers";

beforeEach(resetDb);

let n = 0;
async function workshop() {
  n++;
  const { userId } = await registerWorkshop({
    workshopName: `Taller ${n}`,
    ownerName: "Dueño",
    whatsapp: "5512 3456",
    email: `dueno${n}@t.gt`,
    password: "segura123",
  });
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

const mecanico = { name: "Luis Mecánico", email: "luis@t.gt", password: "llave1234", role: "STAFF" };

describe("addWorker", () => {
  it("el ADMIN agrega un STAFF que puede entrar a su mismo taller", async () => {
    const owner = await workshop();
    const w = await addWorker(owner, mecanico);
    expect(w.tenantId).toBe(owner.tenantId);
    expect(w.role).toBe("STAFF");
    const auth = await authenticate("luis@t.gt", "llave1234");
    expect(auth.ok && auth.user.tenantId).toBe(owner.tenantId);
  });

  it("un STAFF no puede agregar trabajadores", async () => {
    const owner = await workshop();
    const staff = await addWorker(owner, mecanico);
    await expect(addWorker(staff, { ...mecanico, email: "otro@t.gt" })).rejects.toThrow(new DomainError("forbidden"));
  });

  it("rechaza correo repetido, rol desconocido y contraseña corta", async () => {
    const owner = await workshop();
    await addWorker(owner, mecanico);
    await expect(addWorker(owner, mecanico)).rejects.toThrow(new DomainError("email_taken"));
    await expect(addWorker(owner, { ...mecanico, email: "x@t.gt", role: "ROOT" })).rejects.toThrow(
      new DomainError("invalid_role")
    );
    await expect(addWorker(owner, { ...mecanico, email: "y@t.gt", password: "1" })).rejects.toThrow(
      new DomainError("weak_password")
    );
  });
});

describe("gestión de trabajadores", () => {
  it("desactivar impide el login", async () => {
    const owner = await workshop();
    const w = await addWorker(owner, mecanico);
    await setWorkerActive(owner, w.id, false);
    expect(await authenticate("luis@t.gt", "llave1234")).toEqual({ ok: false, reason: "invalid" });
    await setWorkerActive(owner, w.id, true);
    expect((await authenticate("luis@t.gt", "llave1234")).ok).toBe(true);
  });

  it("no puede tocar usuarios de otro taller", async () => {
    const a = await workshop();
    const b = await workshop();
    const wb = await addWorker(b, mecanico);
    await expect(setWorkerActive(a, wb.id, false)).rejects.toThrow(new DomainError("user_not_found"));
    await expect(setWorkerRole(a, wb.id, "ADMIN")).rejects.toThrow(new DomainError("user_not_found"));
    await expect(resetWorkerPassword(a, wb.id, "nueva1234")).rejects.toThrow(new DomainError("user_not_found"));
  });

  it("nunca deja al taller sin un ADMIN activo", async () => {
    const owner = await workshop();
    await expect(setWorkerActive(owner, owner.id, false)).rejects.toThrow(new DomainError("last_admin"));
    await expect(setWorkerRole(owner, owner.id, "STAFF")).rejects.toThrow(new DomainError("last_admin"));
  });

  it("con otro ADMIN activo sí se puede degradar al dueño", async () => {
    const owner = await workshop();
    const second = await addWorker(owner, { ...mecanico, role: "ADMIN" });
    await setWorkerRole(second, owner.id, "STAFF");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).role).toBe("STAFF");
  });

  it("resetear contraseña cambia el acceso y quita el bloqueo", async () => {
    const owner = await workshop();
    const w = await addWorker(owner, mecanico);
    await prisma.user.update({ where: { id: w.id }, data: { lockedUntil: new Date(Date.now() + 60_000) } });
    await resetWorkerPassword(owner, w.id, "nueva1234");
    expect((await authenticate("luis@t.gt", "nueva1234")).ok).toBe(true);
    expect((await authenticate("luis@t.gt", "llave1234")).ok).toBe(false);
  });
});

describe("sesión de un trabajador desactivado", () => {
  it("sessionUser deja de devolver al usuario en cuanto se desactiva", async () => {
    const { sessionUser } = await import("@/lib/auth");
    const owner = await workshop();
    const w = await addWorker(owner, mecanico);
    const payload = { userId: w.id, tenantId: w.tenantId, exp: Date.now() / 1000 + 60 };
    expect((await sessionUser(payload))?.id).toBe(w.id);
    await setWorkerActive(owner, w.id, false);
    expect(await sessionUser(payload)).toBeNull();
  });
});

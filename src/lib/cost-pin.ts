import { timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

// El PIN de 5 dígitos (90k combinaciones) solo es seguro con límite de intentos.
// El contador vive en la orden: sobrevive reinicios y varias instancias del server.
export const PIN_MAX_FAILURES = 5;
export const PIN_LOCK_MS = 15 * 60_000;

export type PinCheck = "ok" | "invalid" | "locked";

type PinState = { id: string; costCode: string; pinFailures: number; pinLockedUntil: Date | null };

function pinMatches(expected: string, pin: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function checkCostPin(order: PinState, pin: string): Promise<PinCheck> {
  if (order.pinLockedUntil && order.pinLockedUntil.getTime() > Date.now()) return "locked";

  if (pinMatches(order.costCode, pin)) {
    if (order.pinFailures > 0 || order.pinLockedUntil) {
      await prisma.workOrder.update({
        where: { id: order.id },
        data: { pinFailures: 0, pinLockedUntil: null },
      });
    }
    return "ok";
  }

  // Incremento atómico: intentos en paralelo no se pierden
  const { pinFailures } = await prisma.workOrder.update({
    where: { id: order.id },
    data: { pinFailures: { increment: 1 } },
    select: { pinFailures: true },
  });
  if (pinFailures >= PIN_MAX_FAILURES) {
    await prisma.workOrder.update({
      where: { id: order.id },
      data: { pinFailures: 0, pinLockedUntil: new Date(Date.now() + PIN_LOCK_MS) },
    });
    return "locked";
  }
  return "invalid";
}

import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hitRateLimit } from "@/lib/rate-limit";
import { resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
  await prisma.rateLimit.deleteMany();
});

const T0 = new Date("2026-10-28T15:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);

describe("hitRateLimit", () => {
  it("permite hasta el máximo dentro de la ventana y luego bloquea", async () => {
    for (let i = 0; i < 3; i++) expect(await hitRateLimit("signup:1.2.3.4", 3, 60_000, at(i))).toBe(true);
    expect(await hitRateLimit("signup:1.2.3.4", 3, 60_000, at(10))).toBe(false);
  });

  it("cada clave cuenta por separado", async () => {
    for (let i = 0; i < 3; i++) await hitRateLimit("signup:1.2.3.4", 3, 60_000, at(i));
    expect(await hitRateLimit("signup:5.6.7.8", 3, 60_000, at(5))).toBe(true);
  });

  it("al pasar la ventana se reinicia", async () => {
    for (let i = 0; i < 4; i++) await hitRateLimit("k", 3, 60_000, at(i));
    expect(await hitRateLimit("k", 3, 60_000, at(60_001))).toBe(true);
  });
});

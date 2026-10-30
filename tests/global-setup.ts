import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

export default function setup() {
  rmSync(".vitest", { recursive: true, force: true });
  mkdirSync(".vitest", { recursive: true });
  execSync("pnpm exec prisma db push", {
    env: { ...process.env, DATABASE_URL: "file:./.vitest/test.db" },
    stdio: "pipe",
  });
}

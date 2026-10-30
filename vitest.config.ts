import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests de integración contra una SQLite desechable (no toca dev.db)
const TEST_DB = "file:./.vitest/test.db";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: { TZ: "UTC", DATABASE_URL: TEST_DB, SESSION_SECRET: "test-secret-0123456789abcdef0123456789" },
    // Una sola SQLite compartida: los archivos no corren en paralelo
    fileParallelism: false,
  },
});

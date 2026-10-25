import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tes integrasi memakai MySQL lokal (lihat FTM_TEST_MYSQL_URL) dan berjalan
// berurutan karena koneksi database aplikasi disimpan secara global.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

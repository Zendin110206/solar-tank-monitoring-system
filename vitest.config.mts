import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Penanda modul khusus server; di luar Next.js (tes) diganti modul kosong.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    // Tes integrasi butuh MySQL lokal dan dijalankan lewat `pnpm test:integration`.
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});

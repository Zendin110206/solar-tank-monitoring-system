import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Matikan aturan gaya yang bertabrakan dengan Prettier; format diurus Prettier.
  prettier,
  // Aturan lapisan ADR 0011: src/app mengambil data lewat layanan server/ modul,
  // bukan dari repositori SQL atau koneksi database.
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "mysql2",
              message:
                "src/app tidak memakai database langsung; panggil layanan di server/ modul (ADR 0011).",
            },
            {
              name: "mysql2/promise",
              message:
                "src/app tidak memakai database langsung; panggil layanan di server/ modul (ADR 0011).",
            },
          ],
          patterns: [
            {
              group: ["**/*-repository", "**/mysql-connection"],
              message:
                "src/app tidak mengimpor repositori atau koneksi database; panggil layanan di server/ modul (ADR 0011).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

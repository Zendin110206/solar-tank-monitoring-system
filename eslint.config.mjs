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
  // Aturan 2 ADR 0011: layanan di server/ hanya memakai repositori modulnya sendiri.
  // Repositori modul sendiri diimpor dengan jalur relatif pendek (../lib/..., ./repositories/...);
  // repositori modul lain tertangkap pola di bawah. Folder repositories/ dikecualikan.
  {
    files: ["src/features/*/server/**/*.{ts,tsx}"],
    ignores: ["src/features/*/server/repositories/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Alias @/features/<modul>/... atau jalur relatif ../../<modul>/... (kedalaman berapa pun)
              // yang berakhir di repositori atau koneksi database.
              regex:
                "^(@/features/[^/]+|(\\.\\./)+[^/.][^/]*)/(server/repositories/[^/]+|lib/[^/]*-repository|lib/mysql-connection)$",
              message:
                "Layanan tidak memakai repositori atau koneksi database modul lain; panggil layanan modul itu (ADR 0011).",
            },
          ],
        },
      ],
    },
  },
  // Variabel lingkungan hanya dibaca di katalog src/lib/config/ (server-env.ts dan
  // public-env.ts), sesuai panduan keamanan data Next.js. Tes boleh mengatur process.env.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/config/**", "**/*.test.{ts,tsx}", "**/tests/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Baca pengaturan lewat serverEnv atau publicEnv di src/lib/config/, bukan process.env langsung.",
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

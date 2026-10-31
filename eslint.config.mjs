import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Modul yang tidak boleh dimuat src/app dan komponen tampilan (ADR 0011).
const DATABASE_MODULE_PATTERN =
  "^mysql2(/.*)?$|-repository$|mysql-connection$|/server/repositories/|/lib/database/";
// Regex di dalam selector ESLint harus menulis garis miring dengan escape.
const DATABASE_MODULE_SELECTOR = DATABASE_MODULE_PATTERN.replaceAll("/", "\\/");

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
              group: [
                "**/*-repository",
                "**/mysql-connection",
                "**/server/repositories/**",
              ],
              message:
                "src/app tidak mengimpor repositori atau koneksi database; panggil layanan di server/ modul (ADR 0011).",
            },
          ],
        },
      ],
      // no-restricted-imports tidak melihat import() dinamis dan require().
      "no-restricted-syntax": [
        "error",
        {
          selector: `:matches(ImportExpression[source.value=/${DATABASE_MODULE_SELECTOR}/], CallExpression[callee.name="require"][arguments.0.value=/${DATABASE_MODULE_SELECTOR}/])`,
          message:
            "src/app tidak memuat repositori atau koneksi database, juga lewat import() atau require(); panggil layanan di server/ modul (ADR 0011).",
        },
      ],
    },
  },
  // Komponen tampilan mengikuti batas yang sama dengan src/app.
  {
    files: [
      "src/features/*/components/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: DATABASE_MODULE_PATTERN,
              message:
                "Komponen tidak mengimpor repositori atau koneksi database; data datang dari layanan lewat halaman (ADR 0011).",
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
                "^(@/features/[^/]+|(\\.\\./)+[^/.][^/]*)/(server/repositories/.+|lib/[^/]*-repository|lib/mysql-connection)$",
              message:
                "Layanan tidak memakai repositori atau koneksi database modul lain; panggil layanan modul itu (ADR 0011).",
            },
            {
              // Koneksi database bersama hanya dipakai repositori, baik lewat alias
              // @/lib/database/... maupun jalur relatif ../../lib/database/...
              regex: "(^@|^(\\.\\./)+)/?lib/database/",
              message:
                "Koneksi database hanya dipakai repositori di server/repositories/ (ADR 0011).",
            },
          ],
        },
      ],
    },
  },
  // Aturan 3 ADR 0011: domain/ berisi logika murni tanpa I/O. Hanya boleh memakai
  // domain/ dan types/; tidak boleh database, server/, jaringan, berkas, atau pengaturan.
  {
    files: ["src/features/*/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/server/**",
                "**/lib/*-repository",
                "**/lib/mysql-connection",
                "mysql2",
                "mysql2/*",
                "nodemailer",
                "node:fs",
                "node:fs/*",
                "node:http",
                "node:https",
                "node:net",
                "next/headers",
                "server-only",
                "@/lib/config/*",
              ],
              message:
                "domain/ hanya berisi logika murni tanpa I/O; pindahkan bagian ini ke server/ (ADR 0011).",
            },
            {
              regex: "(^@|^(\\.\\./)+)/?lib/(database|config)/",
              message:
                "domain/ tidak memakai database atau pengaturan; pindahkan bagian ini ke server/ (ADR 0011).",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        ...["fetch", "XMLHttpRequest", "WebSocket"].map((name) => ({
          name,
          message:
            "domain/ hanya berisi logika murni tanpa I/O; pindahkan bagian ini ke server/ (ADR 0011).",
        })),
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
        {
          object: "globalThis",
          property: "process",
          message:
            "Baca pengaturan lewat serverEnv atau publicEnv di src/lib/config/, bukan process.env langsung.",
        },
      ],
    },
  },
  // Impor di dalam satu modul memakai jalur relatif; alias @/features/<modul>/... hanya untuk
  // impor dari modul lain (ADR 0011). Dipasang lewat no-restricted-syntax agar tidak menimpa
  // opsi no-restricted-imports aturan lapisan di atas.
  ...["monitoring", "devices", "auth", "helpdesk", "admin"].map(
    (moduleName) => ({
      files: [`src/features/${moduleName}/**/*.{ts,tsx}`],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: `:matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration)[source.value=/^@\\/features\\/${moduleName}\\//]`,
            message: `Impor di dalam modul ${moduleName} memakai jalur relatif; alias @/features/... hanya untuk modul lain.`,
          },
        ],
      },
    }),
  ),
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

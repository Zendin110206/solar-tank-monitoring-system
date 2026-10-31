import "server-only";

// Pemeriksaan kesiapan skema auth yang dipakai /api/ready (modul monitoring).
// Diimpor langsung dari repositori skema, bukan dari mysql-auth-repository, agar rute yang
// memuat pemeriksaan kesiapan (termasuk /api/health) tidak ikut memuat repositori akun.
export { checkAuthTelegramSchemaFromMysql } from "./repositories/mysql-auth-schema-repository";

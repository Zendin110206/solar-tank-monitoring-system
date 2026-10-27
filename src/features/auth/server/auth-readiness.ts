import "server-only";

// Pemeriksaan kesiapan skema auth yang dipakai /api/ready (modul monitoring).
export { checkAuthTelegramSchemaFromMysql } from "./repositories/mysql-auth-repository";

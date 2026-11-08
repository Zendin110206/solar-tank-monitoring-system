import "server-only";

// Pintu layanan audit keamanan akun untuk src/app (ADR 0011).
// Pembungkus tipis repositori (aturan 5 ADR 0011) karena alurnya sederhana.
export {
  listAuthAuditEvents,
  recordAuthAuditEvent,
} from "./repositories/mysql-auth-repository";

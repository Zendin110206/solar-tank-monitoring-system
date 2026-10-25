import "server-only";

// Pintu layanan audit keamanan akun untuk src/app (ADR 0011).
// Untuk sementara meneruskan fungsi repositori apa adanya.
export {
  listAuthAuditEvents,
  recordAuthAuditEvent,
} from "../lib/mysql-auth-repository";

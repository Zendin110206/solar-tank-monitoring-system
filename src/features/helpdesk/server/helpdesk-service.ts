import "server-only";

// Pintu layanan bantuan web untuk src/app (ADR 0011).
// Untuk sementara meneruskan fungsi repositori apa adanya.
export {
  addUserHelpdeskMessage,
  getOrCreateHelpdeskSession,
  normalizeHelpdeskMessage,
} from "./repositories/mysql-helpdesk-repository";

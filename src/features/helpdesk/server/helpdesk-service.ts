import "server-only";

// Pintu layanan bantuan web untuk src/app (ADR 0011).
// Pembungkus tipis repositori (aturan 5 ADR 0011) karena alurnya sederhana.
export {
  addUserHelpdeskMessage,
  getOrCreateHelpdeskSession,
  normalizeHelpdeskMessage,
} from "./repositories/mysql-helpdesk-repository";

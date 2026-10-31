import "server-only";

// Pintu layanan profil akun milik pengguna sendiri untuk src/app (ADR 0011).
// Pembungkus tipis repositori (aturan 5 ADR 0011) karena alurnya sederhana.
export { updateAuthUserProfile } from "./repositories/mysql-auth-repository";

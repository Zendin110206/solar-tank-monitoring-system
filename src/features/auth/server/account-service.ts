import "server-only";

// Pintu layanan profil akun milik pengguna sendiri untuk src/app (ADR 0011).
// Untuk sementara meneruskan fungsi repositori apa adanya.
export { updateAuthUserProfile } from "../lib/mysql-auth-repository";

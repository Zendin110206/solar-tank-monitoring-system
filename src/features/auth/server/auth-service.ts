import "server-only";

// Pintu kompatibilitas: alur akun dipisah menurut tanggung jawab di folder auth-flows/.
// Daftar ekspor sama dengan sebelum pemecahan.
export {
  resendEmailVerification,
  sendEmailVerificationForUserId,
  verifyEmailToken,
} from "./auth-flows/email-verification";
export {
  getSessionUserFromToken,
  loginWithPassword,
  logoutSession,
  verifyAdminOtpLogin,
} from "./auth-flows/login";
export type { LoginResult, VerifyOtpResult } from "./auth-flows/login";
export {
  changePasswordForSession,
  requestPasswordReset,
  resetPasswordWithToken,
  sendPasswordResetForUserId,
} from "./auth-flows/password";
export { submitAccessRequest } from "./auth-flows/registration";
export {
  listCurrentUserSessions,
  revokeCurrentUserSessionById,
} from "./auth-flows/sessions";
export {
  completeTelegramBinding,
  startTelegramBinding,
} from "./auth-flows/telegram";

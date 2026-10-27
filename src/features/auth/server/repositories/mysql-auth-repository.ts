import "server-only";

// Pintu kompatibilitas: kueri SQL akun dipisah menurut tanggung jawab di folder accounts/.
// Daftar ekspor sama dengan sebelum pemecahan.
export {
  approveAccessRequest,
  createPendingAccessRequest,
  listPendingAccessRequests,
  rejectAccessRequest,
} from "./accounts/access-requests";
export { listAuthAuditEvents, recordAuthAuditEvent } from "./accounts/audit";
export {
  createAuthSession,
  findAuthSessionByTokenHash,
  listAuthSessionsForUser,
  revokeAllUserSessions,
  revokeAuthSession,
  revokeAuthSessionForUser,
  revokeOtherUserSessions,
  touchAuthSessionIfStale,
} from "./accounts/sessions";
export {
  completeTelegramBindingInMysql,
  createTelegramBindTokenRecord,
} from "./accounts/telegram";
export {
  createEmailVerificationTokenRecord,
  createOtpCodeRecord,
  createPasswordResetTokenRecord,
  findEmailVerificationTokenRecord,
  findOtpCodeRecord,
  findPasswordResetTokenRecord,
  markEmailVerificationTokenUsed,
  markOtpAttempt,
  markOtpUsed,
  markPasswordResetTokenUsed,
} from "./accounts/tokens";
export {
  deleteAuthUser,
  listAuthUsersForAdmin,
  setAuthUserStatus,
  updateAuthUserRole,
} from "./accounts/user-admin";
export type {
  AuthUserDirectoryFilters,
  AuthUserDirectoryItem,
  AuthUserDirectoryResult,
  DeletedAuthUserSummary,
} from "./accounts/user-admin";
export {
  findAuthUserById,
  findAuthUserByIdentity,
  findAuthUserByVerifiedTelegramChatId,
  markAuthUserEmailVerified,
  recordFailedLogin,
  resetFailedLogin,
  updateAuthUserPasswordHash,
  updateAuthUserProfile,
} from "./accounts/users";
export type { VerifiedTelegramUserSummary } from "./accounts/users";

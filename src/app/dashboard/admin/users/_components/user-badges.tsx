import { STATUS_BADGE_CLASS } from "@/components/ui/status-tone";
import { type AuthUserDirectoryItem } from "@/features/auth/server/user-admin-service";
import { type AuthUserStatus } from "@/features/auth/types/auth";

function getStatusLabel(status: AuthUserStatus) {
  switch (status) {
    case "active":
      return "Aktif";
    case "disabled":
      return "Nonaktif";
    case "suspended":
      return "Ditahan";
    case "pending":
      return "Pending";
  }
}

function getStatusClass(status: AuthUserStatus) {
  switch (status) {
    case "active":
      return STATUS_BADGE_CLASS.success;
    case "disabled":
      return STATUS_BADGE_CLASS.danger;
    case "suspended":
      return STATUS_BADGE_CLASS.warning;
    case "pending":
      return STATUS_BADGE_CLASS.neutral;
  }
}

function getInitials(
  user: Pick<AuthUserDirectoryItem, "fullName" | "username">,
) {
  const source = user.fullName.trim() || user.username.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

export function StatusBadge({ status }: { status: AuthUserStatus }) {
  return (
    <span
      className={`inline-flex min-w-[5.5rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getStatusClass(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function EmailVerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex min-w-[7.25rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        verified ? STATUS_BADGE_CLASS.success : STATUS_BADGE_CLASS.warning
      }`}
    >
      {verified ? "Terverifikasi" : "Belum verifikasi"}
    </span>
  );
}

export function UserIdentity({
  isCurrentUser,
  user,
}: {
  isCurrentUser: boolean;
  user: AuthUserDirectoryItem;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
        {getInitials(user)}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {user.fullName}
          </p>
          {isCurrentUser ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
              akun Anda
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs leading-5 text-zinc-500">
          @{user.username}
        </p>
      </div>
    </div>
  );
}

import { type AuthRole, type AuthUserStatus } from "@/features/auth/types/auth";
import { Search } from "lucide-react";
import {
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  type SortFilter,
  VERIFICATION_OPTIONS,
  type VerificationFilter,
} from "./users-page-state";

const USER_STATUS_OPTIONS: Array<{
  label: string;
  value: AuthUserStatus | "all";
}> = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Ditahan", value: "suspended" },
  { label: "Nonaktif", value: "disabled" },
];

const ROLE_OPTIONS: Array<{ label: string; value: AuthRole | "all" }> = [
  { label: "Semua role", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" },
];

const FILTER_CONTROL_CLASS =
  "h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none transition hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

export function SearchField({ query }: { query: string }) {
  return (
    <label className="block">
      <span className="sr-only">Cari pengguna</span>
      <span className="relative block">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          className="h-9 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          defaultValue={query}
          name="q"
          placeholder="Cari nama, email, username"
          type="search"
        />
      </span>
    </label>
  );
}

export function UserFilterControls({
  pageSize,
  roleFilter,
  sortFilter,
  statusFilter,
  verificationFilter,
}: {
  pageSize: number;
  roleFilter: AuthRole | "all";
  sortFilter: SortFilter;
  statusFilter: AuthUserStatus | "all";
  verificationFilter: VerificationFilter;
}) {
  return (
    <>
      <label className="block">
        <span className="sr-only">Status</span>
        <select
          className={FILTER_CONTROL_CLASS}
          defaultValue={statusFilter}
          name="status"
        >
          {USER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Role</span>
        <select
          className={FILTER_CONTROL_CLASS}
          defaultValue={roleFilter}
          name="role"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Verifikasi</span>
        <select
          className={FILTER_CONTROL_CLASS}
          defaultValue={verificationFilter}
          name="verification"
        >
          {VERIFICATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Urutkan</span>
        <select
          className={FILTER_CONTROL_CLASS}
          defaultValue={sortFilter}
          name="sort"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Per halaman</span>
        <select
          className={FILTER_CONTROL_CLASS}
          defaultValue={pageSize}
          name="pageSize"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

import { type AuthRole, type AuthUserStatus } from "@/features/auth/types/auth";

export const VERIFICATION_OPTIONS = [
  { label: "Semua email", value: "all" },
  { label: "Terverifikasi", value: "verified" },
  { label: "Belum verifikasi", value: "unverified" },
] as const;

export const SORT_OPTIONS = [
  { label: "Terbaru dibuat", value: "created_desc" },
  { label: "Login terakhir", value: "last_login_desc" },
  { label: "Nama A-Z", value: "name_asc" },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type VerificationFilter = (typeof VERIFICATION_OPTIONS)[number]["value"];

export type SortFilter = (typeof SORT_OPTIONS)[number]["value"];

export type UsersUrlState = {
  page: number;
  pageSize: number;
  query: string;
  role: AuthRole | "all";
  sort: SortFilter;
  status: AuthUserStatus | "all";
  verification: VerificationFilter;
};

export function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

export function getRoleFilter(value: string): AuthRole | "all" {
  return value === "admin" || value === "user" ? value : "all";
}

export function getStatusFilter(value: string): AuthUserStatus | "all" {
  return value === "active" ||
    value === "disabled" ||
    value === "pending" ||
    value === "suspended"
    ? value
    : "all";
}

export function getVerificationFilter(value: string): VerificationFilter {
  return value === "verified" || value === "unverified" ? value : "all";
}

export function getSortFilter(value: string): SortFilter {
  return value === "last_login_desc" || value === "name_asc"
    ? value
    : "created_desc";
}

export function getPositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPageSize(value: string): number {
  const parsed = getPositiveInteger(value, PAGE_SIZE_OPTIONS[0]);

  return PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : PAGE_SIZE_OPTIONS[0];
}

export function getUsersHref(
  current: UsersUrlState,
  overrides: Partial<UsersUrlState>,
) {
  const next = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (next.query) {
    params.set("q", next.query);
  }

  if (next.status !== "all") {
    params.set("status", next.status);
  }

  if (next.role !== "all") {
    params.set("role", next.role);
  }

  if (next.verification !== "all") {
    params.set("verification", next.verification);
  }

  if (next.sort !== "created_desc") {
    params.set("sort", next.sort);
  }

  if (next.pageSize !== PAGE_SIZE_OPTIONS[0]) {
    params.set("pageSize", String(next.pageSize));
  }

  if (next.page > 1) {
    params.set("page", String(next.page));
  }

  const queryString = params.toString();

  return queryString
    ? `/dashboard/admin/users?${queryString}`
    : "/dashboard/admin/users";
}

export function getPageNumbers(page: number, pageCount: number) {
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, pageCount - windowSize + 1));
  const end = Math.min(pageCount, start + windowSize - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

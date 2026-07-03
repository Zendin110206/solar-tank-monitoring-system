"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Ban, Check, KeyRound, LogOut, RefreshCcw, Send, X } from "lucide-react";

import type { AuthRole } from "@/features/auth/types";
import type { AdminActionState } from "./actions";

type AdminServerAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

const INITIAL_ACTION_STATE: AdminActionState = {
  status: "idle",
  message: "",
};

type ButtonVariant =
  | "primary"
  | "dangerOutline"
  | "success"
  | "neutralOutline";

type ButtonIcon =
  | "check"
  | "x"
  | "ban"
  | "refresh"
  | "logout"
  | "send"
  | "key";

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/20",
  dangerOutline:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-600/15",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/20",
  neutralOutline:
    "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-600/10",
};

function getIcon(icon: ButtonIcon) {
  switch (icon) {
    case "check":
      return <Check className="size-4" aria-hidden="true" />;
    case "x":
      return <X className="size-4" aria-hidden="true" />;
    case "ban":
      return <Ban className="size-4" aria-hidden="true" />;
    case "refresh":
      return <RefreshCcw className="size-4" aria-hidden="true" />;
    case "logout":
      return <LogOut className="size-4" aria-hidden="true" />;
    case "send":
      return <Send className="size-4" aria-hidden="true" />;
    case "key":
      return <KeyRound className="size-4" aria-hidden="true" />;
  }
}

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`text-xs font-semibold ${
        state.status === "success" ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({
  children,
  disabled,
  icon,
  variant,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 sm:h-9 sm:px-3 ${buttonVariantClass[variant]}`}
      disabled={Boolean(disabled) || pending}
      type="submit"
    >
      {getIcon(icon)}
      {pending ? "Memproses..." : children}
    </button>
  );
}

export function AdminActionForm({
  action,
  children,
  csrfToken,
  disabled,
  fields,
  icon,
  variant,
}: {
  action: AdminServerAction;
  children: ReactNode;
  csrfToken: string;
  disabled?: boolean;
  fields: Record<string, string>;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="grid gap-1.5">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <SubmitButton disabled={disabled} icon={icon} variant={variant}>
        {children}
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

export function AdminRoleForm({
  action,
  csrfToken,
  currentRole,
  disabled,
  targetUserId,
}: {
  action: AdminServerAction;
  csrfToken: string;
  currentRole: AuthRole;
  disabled?: boolean;
  targetUserId: string;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <input name="csrfToken" type="hidden" value={csrfToken} />
        <input name="targetUserId" type="hidden" value={targetUserId} />
        <select
          aria-label="Role pengguna"
          className="h-9 min-w-28 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-600/15 disabled:bg-zinc-100 disabled:text-zinc-400"
          defaultValue={currentRole}
          disabled={disabled}
          name="role"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <RoleSubmitButton disabled={disabled} />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function RoleSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "..." : "Simpan"}
    </button>
  );
}

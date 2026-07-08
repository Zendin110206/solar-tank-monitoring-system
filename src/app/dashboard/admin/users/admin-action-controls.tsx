"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Ban,
  Check,
  KeyRound,
  LogOut,
  RefreshCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";

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
  | "danger"
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
  | "key"
  | "trash";

const buttonVariantClass: Record<ButtonVariant, string> = {
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/20",
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
    case "trash":
      return <Trash2 className="size-4" aria-hidden="true" />;
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
  compact,
  confirmMessage,
  disabled,
  icon,
  variant,
}: {
  children: ReactNode;
  compact?: boolean;
  confirmMessage?: string;
  disabled?: boolean;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  const label = pending ? "Memproses..." : children;

  return (
    <button
      aria-label={typeof children === "string" ? children : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
        compact ? "size-8 px-0" : "h-9 w-full px-3"
      } ${buttonVariantClass[variant]}`}
      disabled={Boolean(disabled) || pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      title={typeof children === "string" ? children : undefined}
      type="submit"
    >
      {getIcon(icon)}
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        label
      )}
    </button>
  );
}

export function AdminActionForm({
  action,
  children,
  className,
  compact,
  confirmMessage,
  csrfToken,
  disabled,
  fields,
  hideMessage,
  icon,
  variant,
}: {
  action: AdminServerAction;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  confirmMessage?: string;
  csrfToken: string;
  disabled?: boolean;
  fields: Record<string, string>;
  hideMessage?: boolean;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className={`grid gap-1.5 ${className ?? ""}`}>
      <input name="csrfToken" type="hidden" value={csrfToken} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <SubmitButton
        compact={compact}
        confirmMessage={confirmMessage}
        disabled={disabled}
        icon={icon}
        variant={variant}
      >
        {children}
      </SubmitButton>
      {hideMessage ? null : <ActionMessage state={state} />}
    </form>
  );
}

export function AdminRoleForm({
  action,
  compact,
  csrfToken,
  currentRole,
  disabled,
  hideMessage,
  targetUserId,
}: {
  action: AdminServerAction;
  compact?: boolean;
  csrfToken: string;
  currentRole: AuthRole;
  disabled?: boolean;
  hideMessage?: boolean;
  targetUserId: string;
}) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);
  const [roleDraft, setRoleDraft] = useState<{
    baseRole: AuthRole;
    selectedRole: AuthRole;
  }>({
    baseRole: currentRole,
    selectedRole: currentRole,
  });

  const selectedRole =
    roleDraft.baseRole === currentRole ? roleDraft.selectedRole : currentRole;
  const hasRoleChange = selectedRole !== currentRole;
  const submitDisabled = Boolean(disabled) || !hasRoleChange;

  return (
    <form action={formAction} className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <input name="csrfToken" type="hidden" value={csrfToken} />
        <input name="targetUserId" type="hidden" value={targetUserId} />
        <select
          aria-label="Role pengguna"
          className={`rounded-lg border border-zinc-200 bg-white font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-600/15 disabled:bg-zinc-100 disabled:text-zinc-400 ${
            compact ? "h-8 w-24 px-2 text-xs" : "h-9 min-w-28 px-3 text-sm"
          }`}
          onChange={(event) =>
            setRoleDraft({
              baseRole: currentRole,
              selectedRole: event.target.value as AuthRole,
            })
          }
          value={selectedRole}
          disabled={disabled}
          name="role"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <RoleSubmitButton compact={compact} disabled={submitDisabled} />
      </div>
      {hideMessage ? null : <ActionMessage state={state} />}
    </form>
  );
}

function RoleSubmitButton({
  compact,
  disabled,
}: {
  compact?: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label="Simpan role"
      className={`inline-flex items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
        compact ? "size-8 px-0" : "h-9 px-3"
      }`}
      disabled={disabled || pending}
      title="Simpan role"
      type="submit"
    >
      {compact ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          <span className="sr-only">{pending ? "Memproses..." : "Simpan"}</span>
        </>
      ) : pending ? (
        "..."
      ) : (
        "Simpan"
      )}
    </button>
  );
}

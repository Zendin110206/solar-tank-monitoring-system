"use client";

import type { KeyboardEvent, ReactNode } from "react";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal, useFormStatus } from "react-dom";
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

type AdminActionConfirmation = {
  confirmLabel: string;
  description: string;
  eyebrow: string;
  title: string;
};

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
  disabled,
  icon,
  variant,
}: {
  children: ReactNode;
  compact?: boolean;
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

function AdminActionHiddenFields({
  csrfToken,
  fields,
}: {
  csrfToken: string;
  fields: Record<string, string>;
}) {
  return (
    <>
      <input name="csrfToken" type="hidden" value={csrfToken} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
    </>
  );
}

function DirectAdminActionForm({
  action,
  children,
  className,
  compact,
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
      <AdminActionHiddenFields csrfToken={csrfToken} fields={fields} />
      <SubmitButton
        compact={compact}
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

function AdminActionConfirmationDialog({
  action,
  confirmation,
  csrfToken,
  fields,
  icon,
  onClose,
}: {
  action: AdminServerAction;
  confirmation: AdminActionConfirmation;
  csrfToken: string;
  fields: Record<string, string>;
  icon: ButtonIcon;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      activeElement?.focus();
    };
  }, []);

  useEffect(() => {
    if (state.status !== "success") {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, 450);

    return () => window.clearTimeout(timeoutId);
  }, [onClose, state.status]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !pending) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        aria-busy={pending}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20"
        ref={dialogRef}
        role="dialog"
        style={{
          animation:
            "login-shell-enter 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100">
              {getIcon(icon)}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                {confirmation.eyebrow}
              </p>
              <h2
                className="mt-2 text-xl font-semibold text-zinc-950"
                id={titleId}
              >
                {confirmation.title}
              </h2>
            </div>
          </div>
          <button
            aria-label="Tutup dialog konfirmasi"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <p
          className="mt-4 text-sm leading-6 text-zinc-600"
          id={descriptionId}
        >
          {confirmation.description}
        </p>

        <form action={formAction} className="mt-5 grid gap-3">
          <AdminActionHiddenFields csrfToken={csrfToken} fields={fields} />

          {state.status === "error" && state.message ? (
            <p
              aria-live="polite"
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700"
            >
              {state.message}
            </p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p
              aria-live="polite"
              className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700"
            >
              {state.message}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              onClick={onClose}
              ref={cancelButtonRef}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-600/15 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/20 disabled:cursor-wait disabled:bg-red-300"
              disabled={pending}
              type="submit"
            >
              {getIcon(icon)}
              {pending ? "Memproses..." : confirmation.confirmLabel}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function ConfirmedAdminAction({
  action,
  children,
  className,
  compact,
  confirmation,
  csrfToken,
  disabled,
  fields,
  icon,
  variant,
}: {
  action: AdminServerAction;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  confirmation: AdminActionConfirmation;
  csrfToken: string;
  disabled?: boolean;
  fields: Record<string, string>;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <div className={className}>
      <button
        aria-haspopup="dialog"
        className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
          compact ? "size-8 px-0" : "h-9 w-full px-3"
        } ${buttonVariantClass[variant]}`}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        title={typeof children === "string" ? children : undefined}
        type="button"
      >
        {getIcon(icon)}
        {compact ? <span className="sr-only">{children}</span> : children}
      </button>

      {isOpen ? (
        <AdminActionConfirmationDialog
          action={action}
          confirmation={confirmation}
          csrfToken={csrfToken}
          fields={fields}
          icon={icon}
          onClose={handleClose}
        />
      ) : null}
    </div>
  );
}

export function AdminActionForm({
  action,
  children,
  className,
  compact,
  confirmation,
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
  confirmation?: AdminActionConfirmation;
  csrfToken: string;
  disabled?: boolean;
  fields: Record<string, string>;
  hideMessage?: boolean;
  icon: ButtonIcon;
  variant: ButtonVariant;
}) {
  if (confirmation) {
    return (
      <ConfirmedAdminAction
        action={action}
        className={className}
        compact={compact}
        confirmation={confirmation}
        csrfToken={csrfToken}
        disabled={disabled}
        fields={fields}
        icon={icon}
        variant={variant}
      >
        {children}
      </ConfirmedAdminAction>
    );
  }

  return (
    <DirectAdminActionForm
      action={action}
      className={className}
      compact={compact}
      csrfToken={csrfToken}
      disabled={disabled}
      fields={fields}
      hideMessage={hideMessage}
      icon={icon}
      variant={variant}
    >
      {children}
    </DirectAdminActionForm>
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

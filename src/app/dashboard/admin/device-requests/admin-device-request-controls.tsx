"use client";

import { Ban, Check, Download, RefreshCw, RotateCw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveDeviceRequestAction,
  rejectDeviceRequestAction,
  reissueDevicePackageAction,
  resendDevicePackageAction,
  revokeDeviceProvisioningAction,
  type DeviceRequestAdminActionState,
} from "./actions";

const INITIAL_STATE: DeviceRequestAdminActionState = {
  status: "idle",
  message: "",
};

function ActionMessage({ state }: { state: DeviceRequestAdminActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <div aria-live="polite" className="grid gap-2">
      <p
        className={`text-xs font-semibold ${
          state.status === "success" ? "text-emerald-700" : "text-red-700"
        }`}
      >
        {state.message}
      </p>
      {state.status === "success" && state.downloadUrl ? (
        <a
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
          href={state.downloadUrl}
          rel="noreferrer"
          target="_blank"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Download paket firmware
        </a>
      ) : null}
    </div>
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
  icon: "ban" | "check" | "refresh" | "rotate" | "x";
  variant: "dangerOutline" | "neutral" | "primary" | "warning";
}) {
  const { pending } = useFormStatus();
  const Icon =
    icon === "ban"
      ? Ban
      : icon === "check"
        ? Check
        : icon === "refresh"
          ? RefreshCw
          : icon === "rotate"
            ? RotateCw
            : X;
  const variantClass = {
    dangerOutline:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-600/15",
    neutral:
      "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-600/15",
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/20",
    warning:
      "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-600/15",
  }[variant];

  return (
    <button
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${variantClass}`}
      disabled={disabled || pending}
      type="submit"
    >
      <Icon className="size-4" aria-hidden="true" />
      {pending ? "Memproses..." : children}
    </button>
  );
}

export function ApproveDeviceRequestForm({
  csrfToken,
  disabled,
  requestId,
}: {
  csrfToken: string;
  disabled?: boolean;
  requestId: string;
}) {
  const [state, formAction] = useActionState(
    approveDeviceRequestAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-1.5">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="requestId" type="hidden" value={requestId} />
      <SubmitButton disabled={disabled} icon="check" variant="primary">
        Setujui
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

export function RejectDeviceRequestForm({
  csrfToken,
  disabled,
  requestId,
}: {
  csrfToken: string;
  disabled?: boolean;
  requestId: string;
}) {
  const [state, formAction] = useActionState(
    rejectDeviceRequestAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="requestId" type="hidden" value={requestId} />
      <textarea
        className="min-h-20 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/15 disabled:bg-zinc-100 disabled:text-zinc-400"
        disabled={disabled}
        maxLength={1000}
        name="rejectionReason"
        placeholder="Alasan penolakan, misalnya kode perangkat bentrok atau dimensi belum cocok."
        required
      />
      <SubmitButton disabled={disabled} icon="x" variant="dangerOutline">
        Tolak
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

function PackageActionForm({
  action,
  children,
  csrfToken,
  icon,
  requestId,
  variant,
}: {
  action: (
    state: DeviceRequestAdminActionState,
    formData: FormData,
  ) => Promise<DeviceRequestAdminActionState>;
  children: ReactNode;
  csrfToken: string;
  icon: "ban" | "refresh" | "rotate";
  requestId: string;
  variant: "dangerOutline" | "neutral" | "warning";
}) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-1.5">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="requestId" type="hidden" value={requestId} />
      <SubmitButton icon={icon} variant={variant}>
        {children}
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

export function ResendDevicePackageForm({
  csrfToken,
  requestId,
}: {
  csrfToken: string;
  requestId: string;
}) {
  return (
    <PackageActionForm
      action={resendDevicePackageAction}
      csrfToken={csrfToken}
      icon="refresh"
      requestId={requestId}
      variant="neutral"
    >
      Kirim ulang link
    </PackageActionForm>
  );
}

export function ReissueDevicePackageForm({
  csrfToken,
  requestId,
}: {
  csrfToken: string;
  requestId: string;
}) {
  return (
    <PackageActionForm
      action={reissueDevicePackageAction}
      csrfToken={csrfToken}
      icon="rotate"
      requestId={requestId}
      variant="warning"
    >
      Buat ulang paket
    </PackageActionForm>
  );
}

export function RevokeDeviceProvisioningForm({
  csrfToken,
  requestId,
}: {
  csrfToken: string;
  requestId: string;
}) {
  return (
    <PackageActionForm
      action={revokeDeviceProvisioningAction}
      csrfToken={csrfToken}
      icon="ban"
      requestId={requestId}
      variant="dangerOutline"
    >
      Cabut akses
    </PackageActionForm>
  );
}

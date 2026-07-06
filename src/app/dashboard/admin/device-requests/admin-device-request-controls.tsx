"use client";

import {
  Ban,
  Check,
  Download,
  RefreshCw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveDeviceRequestAction,
  cleanupDeviceRequestsAction,
  rejectDeviceRequestAction,
  resetMonitoringDeviceDataAction,
  reissueDevicePackageAction,
  resendDevicePackageAction,
  revokeDeviceProvisioningAction,
  type DeviceRequestAdminActionState,
} from "./actions";

const INITIAL_STATE: DeviceRequestAdminActionState = {
  status: "idle",
  message: "",
};
const CLEANUP_SELECTED_CONFIRMATION = "BERSIHKAN PILIHAN DEVICE";
const CLEANUP_SINGLE_CONFIRMATION = "BERSIHKAN ITEM DEVICE";
const RESET_CONFIRMATION = "BERSIHKAN SEMUA DATA DEVICE";

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
  confirmMessage,
  disabled,
  icon,
  variant,
}: {
  children: ReactNode;
  confirmMessage?: string;
  disabled?: boolean;
  icon: "ban" | "check" | "refresh" | "rotate" | "trash" | "x";
  variant: "danger" | "dangerOutline" | "neutral" | "primary" | "warning";
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
            : icon === "trash"
              ? Trash2
              : X;
  const variantClass = {
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/20",
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
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
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

export function CleanupDeviceRequestForm({
  csrfToken,
  requestId,
  requestLabel,
}: {
  csrfToken: string;
  requestId: string;
  requestLabel: string;
}) {
  const [state, formAction] = useActionState(
    cleanupDeviceRequestsAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-1.5">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="cleanupMode" type="hidden" value="single" />
      <input name="requestIds" type="hidden" value={requestId} />
      <input
        name="confirmation"
        type="hidden"
        value={CLEANUP_SINGLE_CONFIRMATION}
      />
      <SubmitButton
        confirmMessage={`Bersihkan data untuk ${requestLabel}? Aksi ini menghapus pengajuan, paket firmware, event, reading, dan device terkait jika tidak dipakai data lain.`}
        icon="trash"
        variant="dangerOutline"
      >
        Hapus data
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

export function CleanupSelectedDeviceRequestsForm({
  csrfToken,
  formId,
}: {
  csrfToken: string;
  formId: string;
}) {
  const [state, formAction] = useActionState(
    cleanupDeviceRequestsAction,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end"
      id={formId}
    >
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="cleanupMode" type="hidden" value="selected" />
      <label className="grid gap-2 text-sm font-semibold text-zinc-950">
        Hapus pengajuan yang dicentang
        <input
          autoComplete="off"
          className="h-11 rounded-lg border border-amber-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-600/15"
          name="confirmation"
          placeholder={CLEANUP_SELECTED_CONFIRMATION}
          required
        />
      </label>
      <SubmitButton
        confirmMessage="Bersihkan semua pengajuan yang sedang dicentang?"
        icon="trash"
        variant="warning"
      >
        Bersihkan pilihan
      </SubmitButton>
      <p className="text-xs leading-5 text-zinc-500 lg:col-span-2">
        Centang satu atau beberapa pengajuan, ketik tepat{" "}
        <span className="font-semibold">{CLEANUP_SELECTED_CONFIRMATION}</span>,
        lalu bersihkan. Sistem hanya menghapus data yang terkait pilihan.
      </p>
      <div className="lg:col-span-2">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function ResetMonitoringDeviceDataForm({
  csrfToken,
}: {
  csrfToken: string;
}) {
  const [state, formAction] = useActionState(
    resetMonitoringDeviceDataAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <label className="grid gap-2 text-sm font-semibold text-zinc-950">
        Frasa konfirmasi
        <input
          autoComplete="off"
          className="h-11 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-4 focus:ring-red-600/15"
          name="confirmation"
          placeholder={RESET_CONFIRMATION}
          required
        />
      </label>
      <p className="text-xs leading-5 text-zinc-500">
        Ketik tepat <span className="font-semibold">{RESET_CONFIRMATION}</span>{" "}
        untuk membersihkan semua data STO, tangki, perangkat, reading, pengajuan,
        paket firmware, dan event provisioning. Akun pengguna, admin, template
        firmware, dan profil hardware tidak ikut dihapus.
      </p>
      <SubmitButton
        confirmMessage="Bersihkan semua data monitoring perangkat? Gunakan hanya jika benar-benar ingin mulai ulang dari kosong."
        icon="trash"
        variant="danger"
      >
        Bersihkan semua data
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}

import type { DeviceRequestStatus } from "@/features/monitoring/types/monitoring";
import { STATUS_BADGE_CLASS } from "@/components/ui/status-tone";

// Warna lencana status pengajuan perangkat, sama di halaman petugas dan halaman admin.

export function getDeviceRequestStatusClass(status: DeviceRequestStatus) {
  switch (status) {
    case "pending_admin_review":
      return STATUS_BADGE_CLASS.warning;
    case "rejected":
      return STATUS_BADGE_CLASS.danger;
    case "approved_waiting_package":
    case "approved_package_ready":
    case "waiting_firmware_download":
    case "waiting_first_valid_ping":
      return STATUS_BADGE_CLASS.info;
    case "active":
      return STATUS_BADGE_CLASS.success;
    case "expired":
    case "revoked":
    case "package_generation_failed":
      return STATUS_BADGE_CLASS.neutral;
  }
}

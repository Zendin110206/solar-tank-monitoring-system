import "server-only";

// Pintu layanan pengajuan perangkat untuk src/app dan modul lain (ADR 0011).
// Pembungkus tipis repositori (aturan 5): fungsi, tipe hasil, dan transaksinya sama dengan
// repositori; hanya namanya mengikuti kegiatan pengguna. Alur beberapa langkah (menyetujui,
// mengirim email, mencatat pengiriman) masih dijalankan server action.
export {
  activateApprovedDeviceOnFirstPingFromMysql as activateApprovedDeviceOnFirstPing,
  approveDeviceRequestInMysql as approveDeviceRequest,
  createDeviceRequestInMysql as submitDeviceRequest,
  downloadDevicePackageByTokenFromMysql as downloadDevicePackage,
  listDeviceRequestsForAdminFromMysql as listDeviceRequestsForAdmin,
  listDeviceRequestsForUserFromMysql as listDeviceRequestsForUser,
  listHardwareProfilesFromMysql as listDeviceHardwareProfiles,
  recordFirmwarePackageEmailDeliveryInMysql as recordDevicePackageEmailDelivery,
  refreshDevicePackageDownloadTokenInMysql as refreshDevicePackageDownload,
  rejectDeviceRequestInMysql as rejectDeviceRequest,
  reissueDevicePackageInMysql as reissueDevicePackage,
  revokeDeviceProvisioningInMysql as revokeDeviceProvisioning,
} from "./repositories/mysql-device-request-repository";

export type {
  ActivateApprovedDeviceResult,
  CreateDeviceRequestFromMysqlResult as SubmitDeviceRequestResult,
} from "./repositories/mysql-device-request-repository";

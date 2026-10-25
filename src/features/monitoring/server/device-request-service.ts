// Pintu layanan pengajuan perangkat selama transisi lapisan pada ADR 0011.
// Delegasi mempertahankan fungsi, tipe hasil, dan transaksi repositori yang sama.
export {
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
} from "../lib/mysql-device-request-repository";

export type { CreateDeviceRequestFromMysqlResult as SubmitDeviceRequestResult } from "../lib/mysql-device-request-repository";

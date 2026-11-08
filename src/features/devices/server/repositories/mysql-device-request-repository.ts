import "server-only";

// Pintu kompatibilitas selama pemindahan bertahap sesuai ADR 0011.
// Implementasi SQL dipisahkan menurut tanggung jawab tanpa mengubah kontrak.
export {
  rowToFirmwareTemplate,
  rowToHardwareProfile,
  rowToDeviceRequest,
  rowToFirmwarePackage,
  listHardwareProfilesFromMysql,
  listDeviceRequestsForUserFromMysql,
  listDeviceRequestsForAdminFromMysql,
  createDeviceRequestInMysql,
  approveDeviceRequestInMysql,
  recordFirmwarePackageEmailDeliveryInMysql,
  refreshDevicePackageDownloadTokenInMysql,
  reissueDevicePackageInMysql,
  revokeDeviceProvisioningInMysql,
  activateApprovedDeviceOnFirstPingFromMysql,
  downloadDevicePackageByTokenFromMysql,
  rejectDeviceRequestInMysql,
} from "./device-requests/index";
export type {
  CreateDeviceRequestFromMysqlResult,
  ActivateApprovedDeviceResult,
} from "./device-requests/index";

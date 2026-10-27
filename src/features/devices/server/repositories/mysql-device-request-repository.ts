import "server-only";

// Pintu kompatibilitas selama pemindahan bertahap sesuai ADR 0011.
// Implementasi SQL dipisahkan menurut tanggung jawab tanpa mengubah kontrak.
export {
  rowToFirmwareTemplate,
  rowToHardwareProfile,
  rowToDeviceRequest,
  rowToFirmwarePackage,
  listFirmwareTemplatesFromMysql,
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
  isPackageStatus,
} from "./device-requests/index";
export type {
  CreateDeviceRequestFromMysqlResult,
  ApprovedDeviceRequestPackageResult,
  DownloadDevicePackageResult,
  DevicePackageAdminMutationResult,
  ActivateApprovedDeviceResult,
} from "./device-requests/index";

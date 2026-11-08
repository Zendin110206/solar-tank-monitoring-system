import {
  getLocalDeviceKey,
  ingestTelemetry,
} from "@/features/monitoring/server/ingest-telemetry";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  getExpectedProvisioningKey,
  isDeviceAutoProvisioningEnabled,
} from "@/features/devices/server/device-provisioning";
import { getMonitoringStorageDriver } from "@/features/monitoring/server/monitoring-storage";
import {
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientAddress(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

async function checkIngestRateLimit(
  request: Request,
): Promise<Response | null> {
  if (getMonitoringStorageDriver() !== "mysql") {
    return null;
  }

  const deviceIdentifier =
    request.headers.get("x-device-id")?.trim() || "unknown-device";
  const clientAddress = getClientAddress(request.headers);
  const rateLimit = await checkRateLimit({
    key: `ingest:${deviceIdentifier}:${clientAddress}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (rateLimit.allowed) {
    return null;
  }

  return jsonTooManyRequests(
    "Terlalu banyak request device. Coba lagi sebentar.",
    rateLimit.retryAfterSeconds,
  );
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkIngestRateLimit(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Body request harus JSON valid.", 400);
  }

  const result = await ingestTelemetry({
    deviceIdentifier: request.headers.get("x-device-id"),
    deviceKey:
      request.headers.get("x-api-key") ?? request.headers.get("x-device-key"),
    provisioningKey: request.headers.get("x-provisioning-key"),
    expectedDeviceKey: getLocalDeviceKey(),
    expectedProvisioningKey: getExpectedProvisioningKey(),
    allowDeviceAutoProvisioning: isDeviceAutoProvisioningEnabled(),
    payload,
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return jsonOk(result.data, { status: result.status });
}

import {
  getLocalDeviceKey,
  ingestTelemetry,
} from "@/features/monitoring/lib/telemetry-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Body request harus JSON valid.",
      },
      { status: 400 },
    );
  }

  const result = ingestTelemetry({
    deviceIdentifier: request.headers.get("x-device-id"),
    deviceKey:
      request.headers.get("x-api-key") ?? request.headers.get("x-device-key"),
    expectedDeviceKey: getLocalDeviceKey(),
    payload,
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: result.error,
      },
      { status: result.status },
    );
  }

  return Response.json(
    {
      ok: true,
      data: result.data,
    },
    { status: result.status },
  );
}

import "server-only";

import { stringifyJson } from "./shared";
import type { PoolConnection } from "mysql2/promise";
import { randomBytes } from "node:crypto";

function createProvisioningEventId(): string {
  return `provisioning_event_${randomBytes(18).toString("base64url")}`;
}

export async function insertProvisioningEvent({
  actorUserId,
  connection,
  eventType,
  metadata,
  packageId,
  requestId,
}: {
  actorUserId?: string | null;
  connection: PoolConnection;
  eventType: string;
  metadata?: Record<string, unknown> | null;
  packageId?: string | null;
  requestId?: string | null;
}) {
  await connection.execute(
    `
      INSERT INTO monitoring_device_provisioning_events (
        id,
        request_id,
        package_id,
        actor_user_id,
        event_type,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      createProvisioningEventId(),
      requestId ?? null,
      packageId ?? null,
      actorUserId ?? null,
      eventType,
      stringifyJson(metadata ?? null),
    ],
  );
}

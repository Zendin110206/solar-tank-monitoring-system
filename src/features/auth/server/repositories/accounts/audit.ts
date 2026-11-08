import "server-only";

import { type AuthAuditEvent } from "../../../types/auth";
import { createAuthId, hashRequestFingerprint } from "../../auth-crypto";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";
import { toRequiredIso } from "./rows";

type AuthAuditEventRow = RowDataPacket & {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  target_user_id: string | null;
  metadata_json: string | Record<string, unknown> | null;
  created_at: Date;
};

function rowToAuditEvent(row: AuthAuditEventRow): AuthAuditEvent {
  const metadata =
    typeof row.metadata_json === "string"
      ? (JSON.parse(row.metadata_json) as Record<string, unknown>)
      : row.metadata_json;

  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    eventType: row.event_type,
    targetUserId: row.target_user_id,
    metadata,
    createdAt: toRequiredIso(row.created_at),
  };
}

export async function recordAuthAuditEvent({
  actorUserId,
  eventType,
  targetUserId,
  ip,
  userAgent,
  metadata,
}: {
  actorUserId?: string | null;
  eventType: string;
  targetUserId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const pool = getMysqlPool();
  const auditId = createAuthId("aud");

  await pool.execute(
    `INSERT INTO auth_audit_events
      (id, actor_user_id, event_type, target_user_id, ip_hash, user_agent_hash, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      actorUserId ?? null,
      eventType,
      targetUserId ?? null,
      hashRequestFingerprint(ip ?? null),
      hashRequestFingerprint(userAgent ?? null),
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
}

export async function listAuthAuditEvents(): Promise<AuthAuditEvent[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthAuditEventRow[]>(
    `SELECT id, actor_user_id, event_type, target_user_id, metadata_json, created_at
       FROM auth_audit_events
      ORDER BY created_at DESC
      LIMIT 100`,
  );

  return rows.map(rowToAuditEvent);
}

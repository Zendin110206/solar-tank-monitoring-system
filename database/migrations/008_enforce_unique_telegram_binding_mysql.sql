-- Normalize invalid legacy values before enforcing the constraint.
UPDATE auth_users
SET
  telegram_chat_id = NULL,
  telegram_verified_at = NULL
WHERE telegram_chat_id IS NOT NULL
  AND TRIM(telegram_chat_id) = '';

-- Older deployments allowed one Telegram chat to be linked to multiple users.
-- Keep the most recently verified binding, audit every displaced binding, then
-- let the unique index prevent the ambiguity from returning.
CREATE TEMPORARY TABLE auth_telegram_binding_winners (
  telegram_chat_id VARCHAR(120) NOT NULL,
  winner_user_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (telegram_chat_id),
  UNIQUE KEY uniq_auth_telegram_binding_winner_user (winner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO auth_telegram_binding_winners (
  telegram_chat_id,
  winner_user_id
)
SELECT
  ranked.telegram_chat_id,
  ranked.id AS winner_user_id
FROM (
  SELECT
    id,
    telegram_chat_id,
    ROW_NUMBER() OVER (
      PARTITION BY telegram_chat_id
      ORDER BY
        telegram_verified_at DESC,
        updated_at DESC,
        id DESC
    ) AS binding_rank
  FROM auth_users
  WHERE telegram_chat_id IS NOT NULL
) AS ranked
WHERE ranked.binding_rank = 1;

INSERT INTO auth_audit_events (
  id,
  actor_user_id,
  event_type,
  target_user_id,
  metadata_json
)
SELECT
  CONCAT('audit_tg_unique_', REPLACE(UUID(), '-', '')),
  NULL,
  'telegram_unbound_unique_migration',
  displaced.id,
  JSON_OBJECT(
    'reason', 'duplicate_telegram_binding',
    'keptUserId', winners.winner_user_id
  )
FROM auth_users AS displaced
INNER JOIN auth_telegram_binding_winners AS winners
  ON winners.telegram_chat_id = displaced.telegram_chat_id
WHERE displaced.id <> winners.winner_user_id;

UPDATE auth_users AS displaced
INNER JOIN auth_telegram_binding_winners AS winners
  ON winners.telegram_chat_id = displaced.telegram_chat_id
SET
  displaced.telegram_chat_id = NULL,
  displaced.telegram_verified_at = NULL
WHERE displaced.id <> winners.winner_user_id;

DROP TEMPORARY TABLE auth_telegram_binding_winners;

ALTER TABLE auth_users
  ADD UNIQUE KEY uniq_auth_users_telegram_chat_id (telegram_chat_id);

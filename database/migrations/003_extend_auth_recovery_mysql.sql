ALTER TABLE auth_users
  ADD COLUMN password_changed_at DATETIME(3) NULL AFTER password_hash;

ALTER TABLE auth_users
  ADD COLUMN password_reset_required_at DATETIME(3) NULL AFTER password_changed_at;

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
  id VARCHAR(96) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  destination_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_password_reset_token_hash (token_hash),
  KEY idx_auth_password_reset_user_active (user_id, used_at, expires_at),
  KEY idx_auth_password_reset_expires (expires_at),
  CONSTRAINT fk_auth_password_reset_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
  id VARCHAR(96) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  destination_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_email_verify_token_hash (token_hash),
  KEY idx_auth_email_verify_user_active (user_id, used_at, expires_at),
  KEY idx_auth_email_verify_expires (expires_at),
  CONSTRAINT fk_auth_email_verify_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_telegram_bind_tokens (
  id VARCHAR(96) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  chat_id VARCHAR(120) NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_telegram_bind_token_hash (token_hash),
  KEY idx_auth_telegram_bind_user_active (user_id, used_at, expires_at),
  KEY idx_auth_telegram_bind_expires (expires_at),
  CONSTRAINT fk_auth_telegram_bind_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

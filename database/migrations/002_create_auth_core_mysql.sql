CREATE TABLE IF NOT EXISTS auth_users (
  id VARCHAR(64) NOT NULL,
  email VARCHAR(190) NOT NULL,
  username VARCHAR(80) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) NULL,
  telegram_chat_id VARCHAR(120) NULL,
  telegram_verified_at DATETIME(3) NULL,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL,
  last_login_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_users_email (email),
  UNIQUE KEY uniq_auth_users_username (username),
  KEY idx_auth_users_role_status (role, status),
  CONSTRAINT chk_auth_users_role
    CHECK (role IN ('user', 'admin')),
  CONSTRAINT chk_auth_users_status
    CHECK (status IN ('pending', 'active', 'suspended', 'disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_access_requests (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  requested_role VARCHAR(32) NOT NULL DEFAULT 'user',
  access_reason TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  review_note TEXT NULL,
  reviewed_by_user_id VARCHAR(64) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_access_requests_user_pending (user_id, status),
  KEY idx_auth_access_requests_status_created (status, created_at),
  KEY idx_auth_access_requests_reviewer (reviewed_by_user_id),
  CONSTRAINT fk_auth_access_requests_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_auth_access_requests_reviewer
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_auth_access_requests_role
    CHECK (requested_role IN ('user', 'admin')),
  CONSTRAINT chk_auth_access_requests_status
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(96) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  session_token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  last_seen_at DATETIME(3) NOT NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_auth_sessions_token_hash (session_token_hash),
  KEY idx_auth_sessions_user_active (user_id, revoked_at, expires_at),
  KEY idx_auth_sessions_expires (expires_at),
  CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_otp_codes (
  id VARCHAR(96) NOT NULL,
  user_id VARCHAR(64) NULL,
  access_request_id VARCHAR(64) NULL,
  purpose VARCHAR(48) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  destination_hash VARCHAR(128) NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  used_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_auth_otp_user_purpose (user_id, purpose, used_at, expires_at),
  KEY idx_auth_otp_request_purpose (access_request_id, purpose, used_at, expires_at),
  KEY idx_auth_otp_expires (expires_at),
  CONSTRAINT fk_auth_otp_codes_user
    FOREIGN KEY (user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_auth_otp_codes_access_request
    FOREIGN KEY (access_request_id)
    REFERENCES auth_access_requests(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_auth_otp_codes_purpose
    CHECK (purpose IN ('login_admin_2fa', 'register_verify_email', 'reset_password', 'bind_telegram')),
  CONSTRAINT chk_auth_otp_codes_channel
    CHECK (channel IN ('email', 'telegram'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_audit_events (
  id VARCHAR(96) NOT NULL,
  actor_user_id VARCHAR(64) NULL,
  event_type VARCHAR(80) NOT NULL,
  target_user_id VARCHAR(64) NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_auth_audit_actor_created (actor_user_id, created_at),
  KEY idx_auth_audit_target_created (target_user_id, created_at),
  KEY idx_auth_audit_event_created (event_type, created_at),
  CONSTRAINT fk_auth_audit_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_auth_audit_target
    FOREIGN KEY (target_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key VARCHAR(190) NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  window_expires_at DATETIME(3) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (bucket_key),
  KEY idx_auth_rate_limits_expires (window_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

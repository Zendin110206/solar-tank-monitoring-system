CREATE TABLE IF NOT EXISTS helpdesk_sessions (
  id VARCHAR(64) NOT NULL,
  session_code VARCHAR(48) NOT NULL,
  public_token_hash VARCHAR(128) NOT NULL,
  requester_user_id VARCHAR(64) NULL,
  requester_email VARCHAR(190) NULL,
  requester_name VARCHAR(160) NULL,
  source_path VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  last_message_at DATETIME(3) NOT NULL,
  closed_at DATETIME(3) NULL,
  closed_by_chat_id VARCHAR(120) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_helpdesk_sessions_code (session_code),
  UNIQUE KEY uniq_helpdesk_sessions_token (public_token_hash),
  KEY idx_helpdesk_sessions_status_last_message (status, last_message_at),
  KEY idx_helpdesk_sessions_requester (requester_user_id, created_at),
  CONSTRAINT fk_helpdesk_sessions_requester
    FOREIGN KEY (requester_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_helpdesk_sessions_status
    CHECK (status IN ('open', 'closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS helpdesk_messages (
  id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  sender_type VARCHAR(32) NOT NULL,
  sender_label VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  telegram_chat_id VARCHAR(120) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_helpdesk_messages_session_created (session_id, created_at),
  KEY idx_helpdesk_messages_sender_created (sender_type, created_at),
  CONSTRAINT fk_helpdesk_messages_session
    FOREIGN KEY (session_id)
    REFERENCES helpdesk_sessions(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_helpdesk_messages_sender
    CHECK (sender_type IN ('visitor', 'user', 'admin', 'system'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

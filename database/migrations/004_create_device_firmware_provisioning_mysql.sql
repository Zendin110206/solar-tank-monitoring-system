CREATE TABLE IF NOT EXISTS monitoring_firmware_templates (
  id VARCHAR(64) NOT NULL,
  template_key VARCHAR(80) NOT NULL,
  version VARCHAR(40) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  source_path VARCHAR(255) NOT NULL,
  checksum_sha256 VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_firmware_templates_key_version (template_key, version),
  KEY idx_monitoring_firmware_templates_active (is_active, template_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_hardware_profiles (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  board_family VARCHAR(40) NOT NULL,
  board_label VARCHAR(160) NOT NULL,
  sensor_type VARCHAR(80) NOT NULL,
  trigger_pin VARCHAR(24) NOT NULL,
  echo_pin VARCHAR(24) NOT NULL,
  supported_tank_shape VARCHAR(40) NOT NULL,
  firmware_template_id VARCHAR(64) NOT NULL,
  report_interval_ms INT NOT NULL DEFAULT 20000,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_hardware_profiles_code (code),
  KEY idx_monitoring_hardware_profiles_active (is_active, supported_tank_shape),
  KEY idx_monitoring_hardware_profiles_template (firmware_template_id),
  CONSTRAINT fk_monitoring_hardware_profiles_template
    FOREIGN KEY (firmware_template_id)
    REFERENCES monitoring_firmware_templates(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_monitoring_hardware_profiles_shape
    CHECK (supported_tank_shape IN ('rectangular', 'horizontal-cylinder', 'any')),
  CONSTRAINT chk_monitoring_hardware_profiles_interval
    CHECK (report_interval_ms >= 5000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_device_requests (
  id VARCHAR(64) NOT NULL,
  request_code VARCHAR(80) NOT NULL,
  requester_user_id VARCHAR(64) NOT NULL,
  requester_email VARCHAR(190) NOT NULL,
  status VARCHAR(48) NOT NULL DEFAULT 'pending_admin_review',
  site_code VARCHAR(32) NOT NULL,
  site_name VARCHAR(120) NOT NULL,
  area_label VARCHAR(120) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  device_code VARCHAR(80) NOT NULL,
  device_label VARCHAR(160) NOT NULL,
  device_sensor_type VARCHAR(40) NOT NULL DEFAULT 'fuel',
  tank_shape VARCHAR(40) NOT NULL,
  capacity_liter DECIMAL(12, 2) NOT NULL,
  length_cm DECIMAL(10, 2) NULL,
  width_cm DECIMAL(10, 2) NULL,
  height_cm DECIMAL(10, 2) NULL,
  diameter_cm DECIMAL(10, 2) NULL,
  sensor_mount_height_cm DECIMAL(10, 2) NOT NULL,
  load_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  load_unit VARCHAR(12) NOT NULL DEFAULT 'kw',
  diesel_engine_capacity_kva DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cos_phi DECIMAL(5, 3) NOT NULL DEFAULT 0.800,
  low_level_percent DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  critical_level_percent DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  consumption_liter_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
  hardware_profile_id VARCHAR(64) NOT NULL,
  firmware_template_id VARCHAR(64) NOT NULL,
  admin_reviewed_by_user_id VARCHAR(64) NULL,
  admin_reviewed_at DATETIME(3) NULL,
  rejection_reason TEXT NULL,
  validation_warnings_json JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_device_requests_code (request_code),
  KEY idx_monitoring_device_requests_status_created (status, created_at),
  KEY idx_monitoring_device_requests_requester (requester_user_id, created_at),
  KEY idx_monitoring_device_requests_device_code (device_code),
  KEY idx_monitoring_device_requests_sensor_type (device_sensor_type),
  KEY idx_monitoring_device_requests_site_code (site_code),
  KEY idx_monitoring_device_requests_profile (hardware_profile_id),
  KEY idx_monitoring_device_requests_template (firmware_template_id),
  KEY idx_monitoring_device_requests_reviewer (admin_reviewed_by_user_id),
  CONSTRAINT fk_monitoring_device_requests_requester
    FOREIGN KEY (requester_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_device_requests_reviewer
    FOREIGN KEY (admin_reviewed_by_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_monitoring_device_requests_profile
    FOREIGN KEY (hardware_profile_id)
    REFERENCES monitoring_hardware_profiles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_device_requests_template
    FOREIGN KEY (firmware_template_id)
    REFERENCES monitoring_firmware_templates(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_monitoring_device_requests_status
    CHECK (status IN (
      'pending_admin_review',
      'rejected',
      'approved_waiting_package',
      'approved_package_ready',
      'waiting_firmware_download',
      'waiting_first_valid_ping',
      'active',
      'expired',
      'revoked',
      'package_generation_failed'
    )),
  CONSTRAINT chk_monitoring_device_requests_shape
    CHECK (tank_shape IN ('rectangular', 'horizontal-cylinder')),
  CONSTRAINT chk_monitoring_device_requests_sensor_type
    CHECK (device_sensor_type IN ('fuel', 'energy')),
  CONSTRAINT chk_monitoring_device_requests_load_unit
    CHECK (load_unit IN ('kw', 'kva')),
  CONSTRAINT chk_monitoring_device_requests_cos_phi
    CHECK (cos_phi > 0 AND cos_phi <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_device_packages (
  id VARCHAR(64) NOT NULL,
  request_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(64) NULL,
  package_status VARCHAR(40) NOT NULL DEFAULT 'ready',
  device_key_hash VARCHAR(128) NOT NULL,
  download_token_hash VARCHAR(128) NOT NULL,
  download_expires_at DATETIME(3) NOT NULL,
  download_count INT NOT NULL DEFAULT 0,
  max_download_count INT NOT NULL DEFAULT 3,
  package_filename VARCHAR(190) NOT NULL,
  package_size_bytes INT NOT NULL,
  package_checksum_sha256 VARCHAR(64) NULL,
  package_ciphertext MEDIUMBLOB NOT NULL,
  package_iv VARBINARY(16) NOT NULL,
  package_auth_tag VARBINARY(16) NOT NULL,
  content_type VARCHAR(80) NOT NULL DEFAULT 'application/zip',
  firmware_template_id VARCHAR(64) NOT NULL,
  hardware_profile_id VARCHAR(64) NOT NULL,
  generated_at DATETIME(3) NOT NULL,
  first_downloaded_at DATETIME(3) NULL,
  activated_at DATETIME(3) NULL,
  revoked_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_device_packages_download_token (download_token_hash),
  KEY idx_monitoring_device_packages_request (request_id),
  KEY idx_monitoring_device_packages_device (device_id),
  KEY idx_monitoring_device_packages_status (package_status, download_expires_at),
  KEY idx_monitoring_device_packages_template (firmware_template_id),
  KEY idx_monitoring_device_packages_profile (hardware_profile_id),
  CONSTRAINT fk_monitoring_device_packages_request
    FOREIGN KEY (request_id)
    REFERENCES monitoring_device_requests(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_device_packages_device
    FOREIGN KEY (device_id)
    REFERENCES monitoring_devices(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_monitoring_device_packages_template
    FOREIGN KEY (firmware_template_id)
    REFERENCES monitoring_firmware_templates(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_device_packages_profile
    FOREIGN KEY (hardware_profile_id)
    REFERENCES monitoring_hardware_profiles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_monitoring_device_packages_status
    CHECK (package_status IN ('ready', 'downloaded', 'expired', 'revoked', 'activated', 'failed')),
  CONSTRAINT chk_monitoring_device_packages_download_count
    CHECK (download_count >= 0 AND max_download_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_device_provisioning_events (
  id VARCHAR(96) NOT NULL,
  request_id VARCHAR(64) NULL,
  package_id VARCHAR(64) NULL,
  actor_user_id VARCHAR(64) NULL,
  event_type VARCHAR(80) NOT NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_monitoring_device_provisioning_events_request_created (request_id, created_at),
  KEY idx_monitoring_device_provisioning_events_package_created (package_id, created_at),
  KEY idx_monitoring_device_provisioning_events_actor_created (actor_user_id, created_at),
  KEY idx_monitoring_device_provisioning_events_type_created (event_type, created_at),
  CONSTRAINT fk_monitoring_device_provisioning_events_request
    FOREIGN KEY (request_id)
    REFERENCES monitoring_device_requests(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_monitoring_device_provisioning_events_package
    FOREIGN KEY (package_id)
    REFERENCES monitoring_device_packages(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_monitoring_device_provisioning_events_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES auth_users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_ingest_events (
  id VARCHAR(96) NOT NULL,
  device_identifier VARCHAR(80) NULL,
  device_id VARCHAR(64) NULL,
  request_id VARCHAR(64) NULL,
  event_type VARCHAR(80) NOT NULL,
  response_status INT NOT NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent_hash VARCHAR(128) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_monitoring_ingest_events_device_identifier_created (device_identifier, created_at),
  KEY idx_monitoring_ingest_events_device_created (device_id, created_at),
  KEY idx_monitoring_ingest_events_request_created (request_id, created_at),
  KEY idx_monitoring_ingest_events_type_created (event_type, created_at),
  CONSTRAINT fk_monitoring_ingest_events_device
    FOREIGN KEY (device_id)
    REFERENCES monitoring_devices(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_monitoring_ingest_events_request
    FOREIGN KEY (request_id)
    REFERENCES monitoring_device_requests(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO monitoring_firmware_templates (
  id,
  template_key,
  version,
  display_name,
  source_path,
  is_active
) VALUES
  (
    'firmware-template-esp8266-ultrasonic-v1',
    'solartank-esp8266-ultrasonic',
    'v1',
    'SolarTank ESP8266 Ultrasonic',
    'firmware/templates/solartank-esp8266-ultrasonic-v1',
    TRUE
  );

INSERT IGNORE INTO monitoring_hardware_profiles (
  id,
  code,
  name,
  board_family,
  board_label,
  sensor_type,
  trigger_pin,
  echo_pin,
  supported_tank_shape,
  firmware_template_id,
  report_interval_ms,
  is_active
) VALUES
  (
    'hardware-profile-nodemcu-hcsr04-rectangular-v1',
    'nodemcu-hcsr04-rectangular-v1',
    'NodeMCU ESP8266 + HC-SR04 untuk tangki balok',
    'esp8266',
    'NodeMCU 1.0 ESP-12E',
    'HC-SR04',
    'D5',
    'D6',
    'rectangular',
    'firmware-template-esp8266-ultrasonic-v1',
    20000,
    TRUE
  ),
  (
    'hardware-profile-nodemcu-hcsr04-cylinder-v1',
    'nodemcu-hcsr04-cylinder-v1',
    'NodeMCU ESP8266 + HC-SR04 untuk tangki silinder horizontal',
    'esp8266',
    'NodeMCU 1.0 ESP-12E',
    'HC-SR04',
    'D5',
    'D6',
    'horizontal-cylinder',
    'firmware-template-esp8266-ultrasonic-v1',
    20000,
    TRUE
  );

UPDATE monitoring_firmware_templates
SET is_active = TRUE
WHERE id = 'firmware-template-esp8266-ultrasonic-v1';

UPDATE monitoring_hardware_profiles
SET is_active = TRUE
WHERE id IN (
  'hardware-profile-nodemcu-hcsr04-rectangular-v1',
  'hardware-profile-nodemcu-hcsr04-cylinder-v1'
);

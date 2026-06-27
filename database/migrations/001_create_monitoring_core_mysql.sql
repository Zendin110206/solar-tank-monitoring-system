CREATE TABLE IF NOT EXISTS monitoring_sites (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  area_label VARCHAR(120) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_sites_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_tanks (
  id VARCHAR(64) NOT NULL,
  site_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  shape VARCHAR(40) NOT NULL,
  capacity_liter DECIMAL(12, 2) NOT NULL,
  diameter_cm DECIMAL(10, 2) NULL,
  length_cm DECIMAL(10, 2) NULL,
  height_cm DECIMAL(10, 2) NULL,
  width_cm DECIMAL(10, 2) NULL,
  sensor_mount_height_cm DECIMAL(10, 2) NOT NULL,
  low_level_percent DECIMAL(5, 2) NOT NULL,
  critical_level_percent DECIMAL(5, 2) NOT NULL,
  consumption_liter_per_hour DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_monitoring_tanks_site_id (site_id),
  CONSTRAINT fk_monitoring_tanks_site
    FOREIGN KEY (site_id)
    REFERENCES monitoring_sites(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_devices (
  id VARCHAR(64) NOT NULL,
  site_id VARCHAR(64) NOT NULL,
  tank_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  label VARCHAR(160) NOT NULL,
  expected_report_interval_sec INT NOT NULL,
  api_key_hash VARCHAR(128) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_monitoring_devices_code (code),
  KEY idx_monitoring_devices_site_id (site_id),
  KEY idx_monitoring_devices_tank_id (tank_id),
  CONSTRAINT fk_monitoring_devices_site
    FOREIGN KEY (site_id)
    REFERENCES monitoring_sites(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_devices_tank
    FOREIGN KEY (tank_id)
    REFERENCES monitoring_tanks(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_readings (
  id VARCHAR(96) NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  tank_id VARCHAR(64) NOT NULL,
  measured_at DATETIME(3) NOT NULL,
  received_at DATETIME(3) NOT NULL,
  sensor_distance_cm DECIMAL(10, 2) NOT NULL,
  fuel_height_cm DECIMAL(10, 2) NOT NULL,
  volume_liter DECIMAL(12, 2) NOT NULL,
  fill_percent DECIMAL(5, 2) NOT NULL,
  runtime_hour DECIMAL(10, 2) NOT NULL,
  battery_volt DECIMAL(6, 3) NULL,
  rssi_dbm INT NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_monitoring_readings_tank_received (tank_id, received_at),
  KEY idx_monitoring_readings_device_received (device_id, received_at),
  CONSTRAINT fk_monitoring_readings_device
    FOREIGN KEY (device_id)
    REFERENCES monitoring_devices(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_readings_tank
    FOREIGN KEY (tank_id)
    REFERENCES monitoring_tanks(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
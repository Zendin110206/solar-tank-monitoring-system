ALTER TABLE monitoring_readings
  ADD COLUMN reading_resolution VARCHAR(16) NOT NULL DEFAULT 'raw' AFTER raw_payload;

ALTER TABLE monitoring_readings
  ADD COLUMN bucket_start DATETIME(3) NULL AFTER reading_resolution;

ALTER TABLE monitoring_readings
  ADD COLUMN bucket_end DATETIME(3) NULL AFTER bucket_start;

ALTER TABLE monitoring_readings
  ADD COLUMN sample_count INT UNSIGNED NOT NULL DEFAULT 1 AFTER bucket_end;

ALTER TABLE monitoring_readings
  ADD COLUMN volume_liter_min DECIMAL(12, 2) NULL AFTER sample_count;

ALTER TABLE monitoring_readings
  ADD COLUMN volume_liter_max DECIMAL(12, 2) NULL AFTER volume_liter_min;

ALTER TABLE monitoring_readings
  ADD COLUMN fill_percent_min DECIMAL(5, 2) NULL AFTER volume_liter_max;

ALTER TABLE monitoring_readings
  ADD COLUMN fill_percent_max DECIMAL(5, 2) NULL AFTER fill_percent_min;

ALTER TABLE monitoring_readings
  ADD COLUMN quality_payload JSON NULL AFTER fill_percent_max;

ALTER TABLE monitoring_readings
  ADD UNIQUE KEY uniq_monitoring_readings_device_resolution_bucket (
    device_id,
    reading_resolution,
    bucket_start
  );

ALTER TABLE monitoring_readings
  ADD KEY idx_monitoring_readings_resolution_received (
    reading_resolution,
    received_at,
    id
  );

ALTER TABLE monitoring_readings
  ADD CONSTRAINT chk_monitoring_readings_resolution
    CHECK (reading_resolution IN ('raw', '5m'));

CREATE TABLE IF NOT EXISTS monitoring_latest_readings (
  device_id VARCHAR(64) NOT NULL,
  id VARCHAR(96) NOT NULL,
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
  quality_payload JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (device_id),
  UNIQUE KEY uniq_monitoring_latest_readings_id (id),
  KEY idx_monitoring_latest_readings_tank_received (tank_id, received_at),
  CONSTRAINT fk_monitoring_latest_readings_device
    FOREIGN KEY (device_id)
    REFERENCES monitoring_devices(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_monitoring_latest_readings_tank
    FOREIGN KEY (tank_id)
    REFERENCES monitoring_tanks(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO monitoring_latest_readings (
  device_id,
  id,
  tank_id,
  measured_at,
  received_at,
  sensor_distance_cm,
  fuel_height_cm,
  volume_liter,
  fill_percent,
  runtime_hour,
  battery_volt,
  rssi_dbm,
  raw_payload,
  quality_payload
)
SELECT
  latest.device_id,
  latest.id,
  latest.tank_id,
  latest.measured_at,
  latest.received_at,
  latest.sensor_distance_cm,
  latest.fuel_height_cm,
  latest.volume_liter,
  latest.fill_percent,
  latest.runtime_hour,
  latest.battery_volt,
  latest.rssi_dbm,
  latest.raw_payload,
  latest.quality_payload
FROM (
  SELECT
    reading.*,
    ROW_NUMBER() OVER (
      PARTITION BY reading.device_id
      ORDER BY reading.received_at DESC, reading.id DESC
    ) AS row_number_for_device
  FROM monitoring_readings reading
) latest
WHERE latest.row_number_for_device = 1
ON DUPLICATE KEY UPDATE
  id = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(id), monitoring_latest_readings.id),
  tank_id = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(tank_id), monitoring_latest_readings.tank_id),
  measured_at = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(measured_at), monitoring_latest_readings.measured_at),
  sensor_distance_cm = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(sensor_distance_cm), monitoring_latest_readings.sensor_distance_cm),
  fuel_height_cm = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(fuel_height_cm), monitoring_latest_readings.fuel_height_cm),
  volume_liter = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(volume_liter), monitoring_latest_readings.volume_liter),
  fill_percent = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(fill_percent), monitoring_latest_readings.fill_percent),
  runtime_hour = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(runtime_hour), monitoring_latest_readings.runtime_hour),
  battery_volt = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(battery_volt), monitoring_latest_readings.battery_volt),
  rssi_dbm = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(rssi_dbm), monitoring_latest_readings.rssi_dbm),
  raw_payload = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(raw_payload), monitoring_latest_readings.raw_payload),
  quality_payload = IF(VALUES(received_at) >= monitoring_latest_readings.received_at, VALUES(quality_payload), monitoring_latest_readings.quality_payload),
  received_at = GREATEST(monitoring_latest_readings.received_at, VALUES(received_at));

ALTER TABLE monitoring_device_requests
  ADD COLUMN device_sensor_type VARCHAR(40) NOT NULL DEFAULT 'fuel' AFTER device_label;

ALTER TABLE monitoring_device_requests
  ADD COLUMN load_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER sensor_mount_height_cm;

ALTER TABLE monitoring_device_requests
  ADD COLUMN load_unit VARCHAR(12) NOT NULL DEFAULT 'kw' AFTER load_value;

ALTER TABLE monitoring_device_requests
  ADD COLUMN diesel_engine_capacity_kva DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER load_unit;

ALTER TABLE monitoring_device_requests
  ADD COLUMN cos_phi DECIMAL(5, 3) NOT NULL DEFAULT 0.800 AFTER diesel_engine_capacity_kva;

ALTER TABLE monitoring_device_requests
  ADD KEY idx_monitoring_device_requests_sensor_type (device_sensor_type);

ALTER TABLE monitoring_device_requests
  ADD CONSTRAINT chk_monitoring_device_requests_sensor_type
    CHECK (device_sensor_type IN ('fuel', 'energy'));

ALTER TABLE monitoring_device_requests
  ADD CONSTRAINT chk_monitoring_device_requests_load_unit
    CHECK (load_unit IN ('kw', 'kva'));

ALTER TABLE monitoring_device_requests
  ADD CONSTRAINT chk_monitoring_device_requests_cos_phi
    CHECK (cos_phi > 0 AND cos_phi <= 1);

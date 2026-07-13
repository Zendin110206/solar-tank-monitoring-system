ALTER TABLE monitoring_sites
  ADD COLUMN regional_label VARCHAR(40) NOT NULL DEFAULT 'TREG 5' AFTER area_label;

ALTER TABLE monitoring_sites
  ADD COLUMN wilayah_label VARCHAR(40) NOT NULL DEFAULT 'TIF 3' AFTER regional_label;

ALTER TABLE monitoring_sites
  ADD KEY idx_monitoring_sites_regional_wilayah (regional_label, wilayah_label);

ALTER TABLE monitoring_device_requests
  ADD COLUMN regional_label VARCHAR(40) NOT NULL DEFAULT 'TREG 5' AFTER area_label;

ALTER TABLE monitoring_device_requests
  ADD COLUMN wilayah_label VARCHAR(40) NOT NULL DEFAULT 'TIF 3' AFTER regional_label;

ALTER TABLE monitoring_device_requests
  ADD KEY idx_monitoring_device_requests_regional_wilayah (regional_label, wilayah_label);

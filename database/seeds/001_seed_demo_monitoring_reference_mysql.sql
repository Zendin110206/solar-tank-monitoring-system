INSERT INTO monitoring_sites
  (id, code, name, area_label, latitude, longitude, is_active)
VALUES
  ('site-tph', 'TPH', 'STO TPH', 'Area demo', -7.6500000, 112.9000000, TRUE),
  ('site-psn', 'PSN', 'STO Pasuruan', 'Area demo', -7.6500000, 112.9100000, TRUE),
  ('site-nja', 'NJA', 'STO NJA', 'Area demo', -7.6800000, 112.8600000, TRUE),
  ('site-jto', 'JTO', 'STO JTO', 'Area demo', -7.7200000, 112.8800000, TRUE),
  ('site-skp', 'SKP', 'STO SKP', 'Area demo', -7.7000000, 112.9400000, TRUE)
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  name = VALUES(name),
  area_label = VALUES(area_label),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  is_active = VALUES(is_active);

INSERT INTO monitoring_tanks
  (
    id,
    site_id,
    name,
    shape,
    capacity_liter,
    diameter_cm,
    length_cm,
    height_cm,
    width_cm,
    sensor_mount_height_cm,
    low_level_percent,
    critical_level_percent,
    consumption_liter_per_hour,
    is_active
  )
VALUES
  ('tank-tph-main', 'site-tph', 'Tangki utama', 'horizontal-cylinder', 5000, 150, 283, NULL, NULL, 150, 30, 15, 25, TRUE),
  ('tank-psn-main', 'site-psn', 'Tangki utama', 'rectangular', 540, NULL, 150, 60, 60, 60, 30, 15, 25, TRUE),
  ('tank-nja-main', 'site-nja', 'Tangki utama', 'horizontal-cylinder', 5000, 150, 283, NULL, NULL, 150, 30, 15, 25, TRUE),
  ('tank-jto-main', 'site-jto', 'Tangki utama', 'horizontal-cylinder', 5000, 150, 283, NULL, NULL, 150, 30, 15, 25, TRUE),
  ('tank-skp-main', 'site-skp', 'Tangki utama', 'horizontal-cylinder', 5000, 150, 283, NULL, NULL, 150, 30, 15, 25, TRUE)
ON DUPLICATE KEY UPDATE
  site_id = VALUES(site_id),
  name = VALUES(name),
  shape = VALUES(shape),
  capacity_liter = VALUES(capacity_liter),
  diameter_cm = VALUES(diameter_cm),
  length_cm = VALUES(length_cm),
  height_cm = VALUES(height_cm),
  width_cm = VALUES(width_cm),
  sensor_mount_height_cm = VALUES(sensor_mount_height_cm),
  low_level_percent = VALUES(low_level_percent),
  critical_level_percent = VALUES(critical_level_percent),
  consumption_liter_per_hour = VALUES(consumption_liter_per_hour),
  is_active = VALUES(is_active);

INSERT INTO monitoring_devices
  (
    id,
    site_id,
    tank_id,
    code,
    label,
    expected_report_interval_sec,
    api_key_hash,
    is_active
  )
VALUES
  ('device-tph-main', 'site-tph', 'tank-tph-main', 'demo-tph-01', 'NodeMCU Ultrasonic Demo', 300, 'sha256:749a381823e9c3e494badf95003e255a389eb65b1f894a058a54f27b1834d1f4', TRUE),
  ('device-psn-main', 'site-psn', 'tank-psn-main', 'demo-psn-01', 'NodeMCU Ultrasonic Demo', 300, 'sha256:89e3d6fef81054bd1948dee958084e69a7120e43587c7ae0244ba2f5b8354ef1', TRUE),
  ('device-nja-main', 'site-nja', 'tank-nja-main', 'demo-nja-01', 'NodeMCU Ultrasonic Demo', 300, 'sha256:b700ffe64480089f21b90066d3900ce529d9ddfc5f7b4ac4804dc2c9876188aa', TRUE),
  ('device-jto-main', 'site-jto', 'tank-jto-main', 'demo-jto-01', 'NodeMCU Ultrasonic Demo', 300, 'sha256:625067fdabde596e7fc076429db5d271e54b97ca690fefe188d9e81eaeb54688', TRUE),
  ('device-skp-main', 'site-skp', 'tank-skp-main', 'demo-skp-01', 'NodeMCU Ultrasonic Demo', 300, 'sha256:075c5a726900bd6bcaf8c5695a87a0928fa7f283a39bd735706011232ed9544b', TRUE)
ON DUPLICATE KEY UPDATE
  site_id = VALUES(site_id),
  tank_id = VALUES(tank_id),
  code = VALUES(code),
  label = VALUES(label),
  expected_report_interval_sec = VALUES(expected_report_interval_sec),
  api_key_hash = VALUES(api_key_hash),
  is_active = VALUES(is_active);

#include "device_config.h"
#include "hardware_profile.h"

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
#elif defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif

// Template firmware SolarTank untuk pengujian perangkat lapangan.
// TODO: lengkapi koneksi WiFi dan pengiriman HTTP setelah profile hardware
// final disepakati bersama tim perangkat.

static float readDistanceCm() {
  pinMode(SOLARTANK_TRIGGER_PIN, OUTPUT);
  pinMode(SOLARTANK_ECHO_PIN, INPUT);

  digitalWrite(SOLARTANK_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(SOLARTANK_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(SOLARTANK_TRIGGER_PIN, LOW);

  const unsigned long duration = pulseIn(SOLARTANK_ECHO_PIN, HIGH, 30000);
  if (duration == 0) {
    return -1;
  }

  return duration * 0.0343f / 2.0f;
}

static float calculateFuelHeightCm(float distanceCm) {
  const float height = SOLARTANK_SENSOR_MOUNT_HEIGHT_CM - distanceCm;
  if (height < 0) {
    return 0;
  }

  return height;
}

static float calculateVolumeLiter(float fuelHeightCm) {
  if (String(SOLARTANK_TANK_SHAPE) == "rectangular") {
    return (SOLARTANK_TANK_LENGTH_CM * SOLARTANK_TANK_WIDTH_CM * fuelHeightCm) / 1000.0f;
  }

  // TODO: ganti dengan formula silinder horizontal final sebelum firmware
  // dipakai untuk production.
  const float fillRatio = fuelHeightCm / SOLARTANK_SENSOR_MOUNT_HEIGHT_CM;
  return SOLARTANK_TANK_CAPACITY_LITER * constrain(fillRatio, 0.0f, 1.0f);
}

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("SolarTank firmware test siap.");
  Serial.print("Perangkat: ");
  Serial.println(SOLARTANK_DEVICE_CODE);
  Serial.print("Mode sensor: ");
  Serial.println(SOLARTANK_DEVICE_SENSOR_TYPE);
  Serial.print("Estimasi konsumsi L/jam: ");
  Serial.println(SOLARTANK_CONSUMPTION_LITER_PER_HOUR);
  Serial.print("Endpoint: ");
  Serial.println(SOLARTANK_API_BASE_URL);
}

void loop() {
  const float distanceCm = readDistanceCm();
  const float fuelHeightCm = calculateFuelHeightCm(distanceCm);
  const float volumeLiter = calculateVolumeLiter(fuelHeightCm);
  const float percent = SOLARTANK_TANK_CAPACITY_LITER > 0
    ? (volumeLiter / SOLARTANK_TANK_CAPACITY_LITER) * 100.0f
    : 0.0f;

  Serial.print("Distance cm: ");
  Serial.println(distanceCm);
  Serial.print("Fuel height cm: ");
  Serial.println(fuelHeightCm);
  Serial.print("Volume liter: ");
  Serial.println(volumeLiter);
  Serial.print("Percent: ");
  Serial.println(percent);

  // TODO: kirim data ke POST /api/ingest memakai header X-Device-Key
  // setelah koneksi WiFi perangkat siap.
  delay(SOLARTANK_REPORT_INTERVAL_MS);
}

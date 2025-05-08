#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <stdio.h>
#include <stdlib.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define DHTTYPE DHT11
#define DHTPIN 17
#define LEDPIN 16
#define SEALEVELPRESSURE_HPA (1013.25)

LiquidCrystal_I2C lcd(0x21, 16,1);
Adafruit_BME280 bme;


void setup() {
  // put your setup code here, to run once:
  pinMode(LEDPIN, OUTPUT);
  mq2.begin();
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  WiFi.begin("", "");
  bme.begin();
  delay(10);
}
void loop() {
  digitalWrite(LEDPIN, HIGH);
  HTTPClient client;

  float humedad = bme.readHumidity();
  float temperatura = bme.readTemperature();
  float pressure = (bme.readPressure() / 100.0F);
  float alt = bme.readAltitude(SEALEVELPRESSURE_HPA);

  char* hum = (char*)malloc(15 * sizeof(char));
  char* temp = (char*)malloc(15 * sizeof(char));

  sprintf(hum, "%.2f%%", humedad);
  sprintf(temp, "%.2fC", temperatura);
  lcd.setCursor(0, 0);
  lcd.print(hum);
  lcd.setCursor(7,0);
  lcd.print(temp);

  client.begin("https://estacion.koyeb.app/api/sensor-update");
  client.addHeader("Content-Type", "application/json");

  float* values = mq2.read(true);
  float lpg = mq2.readLPG();
  float co = mq2.readCO();
  float smoke = mq2.readSmoke();

  StaticJsonDocument<200> doc;

  doc["temp"] = temperatura;
  doc["humidity"] = humedad;
  doc["lpg"] = lpg;
  doc["co"] = co;
  doc["smoke"] = smoke;
  doc["pressure"] = pressure;
  doc["alt"] = alt;

  String data;
  serializeJson(doc, data);
  int code = client.POST(data);

  Serial.print(code);
  client.end();
  free(hum);
  free(temp);
  digitalWrite(LEDPIN, LOW);
  delay(10000); // 10 seconds
  lcd.clear();

}

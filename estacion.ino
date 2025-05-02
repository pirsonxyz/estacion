#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <stdio.h>
#include <stdlib.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define DHTTYPE DHT11
#define DHTPIN 17

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x20, 16,1);
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  dht.begin();
  WiFi.begin("", "");
 

}
void loop() {
  HTTPClient client;
  // put your main code here, to run repeatedly:
  float humedad = dht.readHumidity();
  float temperatura = dht.readTemperature();
  char hum [32];
  char temp = [32];
  sprintf(hum, "%.2f%%", humedad);
  sprintf(temp, "%.2fC", temperatura);
  lcd.setCursor(0, 0);
  lcd.print(hum);
  lcd.setCursor(7,0);
  lcd.print(temp);

  client.begin("");
  client.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["temp"] = temperatura;
  doc["humidity"] = humedad;


  String data;
  serializeJson(doc, data);
  int code = client.POST(data);
  Serial.print(code);
  client.end();
  delay(5000);
  free(hum);
  free(temp);
  lcd.clear();
  
  
}


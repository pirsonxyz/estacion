import React, { useEffect, useState } from "react";
import * as HI from "heat-index";

interface SensorData {
  temp: number;
  humidity: number;
  lpg: number;
  co: number;
  smoke: number;
}

function App() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temp: 0.0,
    humidity: 0.0,
    lpg: 0.0,
    co: 0.0,
    smoke: 0.0
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        setError(null); // Clear previous errors
        const response = await fetch("/api/latest");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SensorData = await response.json();
        setSensorData(data);
      } catch (e: any) {
        console.error("Failed to fetch sensor data:", e);
        setError(`Failed to load data: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="sensor-data-container">
      {isLoading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!isLoading && !error && (
        <>
          <div className="reading">
            <h2>Temperatura</h2>
            <p>{sensorData.temp.toFixed(1)} °C</p>
          </div>
          <div className="reading">
            <h2>Humedad</h2>
            <p>{sensorData.humidity.toFixed(1)} %</p>
          </div>
          <div className="reading">
            <h2>Sensación</h2>
            <p>
              {HI.heatIndex({
                temperature: sensorData.temp,
                humidity: sensorData.humidity,
              }).toFixed(1)} °C
            </p>
          </div>
          <div className="reading">
            <h2>LPG</h2>
            <p>{sensorData.lpg.toFixed(1)} ppm</p>
          </div>
          <div className="reading">
            <h2>CO</h2>
            <p>{sensorData.co.toFixed(1)} ppm</p>
          </div>
          <div className="reading">
            <h2>Humo</h2>
            <p>{sensorData.smoke.toFixed(1)} ppm</p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import * as HI from "heat-index";
import SensorCard from "./SensorCard.tsx";
import StatisticsSection from "./StatisticsSection";

interface SensorData {
  temp: number,
  humidity: number,
  pressure: number,
  alt: number,
}

function App() {
  // Sensor data state
  const [sensorData, setSensorData] = useState<SensorData>({
    temp: 0.0,
    humidity: 0.0,
    pressure: 0.0,
    alt: 0.0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // Subsequent refreshes
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("dark-mode");
    if (savedTheme !== null) {
      return savedTheme === "true";
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  });

  // Apply theme effect
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  // Format current time for "last updated"
  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // If this is not the initial load, use the "refreshing" state instead
        if (!isLoading) {
          setIsRefreshing(true);
        }

        const response = await fetch("/api/latest");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SensorData = await response.json();
        setSensorData(data);
        setLastUpdated(formatTime());
      } catch (e: any) {
        console.error("Failed to fetch sensor data:", e);
        setError(`No se pudo cargar la data: ${e.message}`);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);


  // Heat index calculation
  const heatIndexValue =
    !isLoading && !error
      ? HI.heatIndex({
        temperature: sensorData.temp,
        humidity: sensorData.humidity,
      }).toFixed(1)
      : "N/A";

  return (
    <div className="app-container">
      {/* Header with theme switcher */}
      <header className="app-header">
        <h1>
          <i className="fas fa-broadcast-tower"></i> Estación Meteorológica SJT
        </h1>

        {/* Status and theme area */}
        <div className="header-controls">
          {/* Last updated timestamp */}
          {lastUpdated && (
            <div className="last-updated">
              <i className={`fas fa-sync ${isRefreshing ? "fa-spin" : ""}`}></i>
              <span>Última vez actualizada: {lastUpdated}</span>
            </div>
          )}

          {/* Theme switcher */}
          <div className="theme-switch-wrapper">
            <span className="theme-label">
              <i className="fas fa-sun"></i>
            </span>
            <label className="theme-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={() => setIsDarkMode(!isDarkMode)}
              />
              <span className="slider round"></span>
            </label>
            <span className="theme-label">
              <i className="fas fa-moon"></i>
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div id="sensor-data-container">
        {isLoading && (
          <div className="status-message loading-message">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando datos...</p>
          </div>
        )}

        {error && (
          <div className="status-message error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <SensorCard
              iconClass="fas fa-thermometer-half"
              title="Temperatura"
              value={sensorData.temp.toFixed(1)}
              unit="°C"
              isRefreshing={isRefreshing}
            />
            <SensorCard
              iconClass="fas fa-tint"
              title="Humedad"
              value={sensorData.humidity.toFixed(1)}
              unit="%"
              isRefreshing={isRefreshing}
            />
            <SensorCard
              iconClass="fas fa-temperature-high"
              title="Sensación Térmica"
              value={heatIndexValue}
              unit="°C"
              isRefreshing={isRefreshing}
            />
            <SensorCard
              iconClass="fa-solid fa-dumbbell"
              title="Presión Atmosférica"
              value={sensorData.pressure}
              unit="hPa"
              isRefreshing={isRefreshing}
            ></SensorCard>
            <SensorCard
              iconClass="fa-solid fa-up-long"
              title="Altura sobre el nivel del mar"
              value={sensorData.alt}
              unit="m"
              isRefreshing={isRefreshing}
            ></SensorCard>
          </>
        )}
      </div>
      <StatisticsSection />
    </div>
  );
}

export default App;

import StatisticCard from "./StatisticCard"; // Adjust path if necessary

import React, { useEffect, useState } from "react";

// In a real application, you would fetch or calculate this data
// For now, we'll use placeholders.
interface StatisticsData {
  maxTemp24h: number;
  minTemp24h: number;
  avgHum24h: number;
  //   maxWind24h: number | string;
  //   // Add other stats as needed
}

const StatisticsSection: React.FC = () => {
  const [statsData, setStatsData] = useState<StatisticsData>({ maxTemp24h: 0.0, minTemp24h: 0.0, avgHum24h: 0.0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setErrorStats(null);
        if (!isLoadingStats) {
          setIsLoadingStats(true);
        }

        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: StatisticsData = await response.json();
        setStatsData(data);
      } catch (e: any) {
        console.error("Failed to fetch sensor data:", e);
        setErrorStats(`No se pudo cargar la data: ${e.message}`);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoadingStats) {
    return (
      <div className="status-message loading-message">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (errorStats) {
    return (
      <div id="statistics-section" className="statistics-section">
        <h2 className="section-title">
          <i className="fas fa-chart-line"></i> Estadísticas
        </h2>
        <div className="status-message error-message" style={{ width: '100%' }}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{errorStats}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="statistics-section" className="statistics-section">
      <h2 className="section-title">
        <i className="fas fa-chart-line"></i> Estadísticas
      </h2>
      <div id="statistics-grid" className="statistics-grid">
        <StatisticCard
          iconClass="fas fa-temperature-high"
          title="Temperatura Máx. (24h)"
          value={statsData.maxTemp24h} // Replace with actual data: statsData?.maxTemp24h ?? '--'
          unit="°C"
        />
        <StatisticCard
          iconClass="fas fa-temperature-low"
          title="Temperatura Mín. (24h)"
          value={statsData.minTemp24h} // Replace with actual data: statsData?.minTemp24h ?? '--'
          unit="°C"
        />
        <StatisticCard
          iconClass="fas fa-tin"
          title="Humedad promedio (24h)"
          value={statsData.avgHum24h.toFixed(2)} // Replace with actual data: statsData?.minTemp24h ?? '--'
          unit="%"
        />
        {/* You can add more StatisticCard components here for other stats */}
        {/* For example:
        <StatisticCard
          iconClass="fas fa-cloud-rain"
          title="Precipitación (24h)"
          value="--"
          unit="mm"
        />
        <StatisticCard
          iconClass="fas fa-tachometer-alt"
          title="Presión Máx. (24h)"
          value="--"
          unit="hPa"
        />
        */}
      </div>
    </div>
  );
};

export default StatisticsSection;


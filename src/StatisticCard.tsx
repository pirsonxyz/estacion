// StatisticCard.tsx
import React from "react";

interface StatisticCardProps {
  iconClass: string;
  title: string;
  value: string | number;
  unit: string;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  iconClass,
  title,
  value,
  unit,
}) => {
  return (
    <div className="statistic-card">
      <div className="statistic-header">
        <i className={iconClass}></i>
        <h3>{title}</h3>
      </div>
      <p className="statistic-value">
        {value} <span className="statistic-unit">{unit}</span>
      </p>
    </div>
  );
};

export default StatisticCard;


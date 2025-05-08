import React, { useEffect, useState, useRef } from "react";
interface SensorCardProps {
  iconClass: string;
  title: string;
  value: string | number;
  unit: string;
  isRefreshing: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({
  iconClass,
  title,
  value,
  unit,
  isRefreshing,
}) => {
  const prevValueRef = useRef<string | number>(value);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Only animate when value has actually changed and isn't the initial load
    if (prevValueRef.current !== value && prevValueRef.current !== 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className={`reading ${isRefreshing ? "refreshing" : ""}`}>
      <div className="reading-header">
        <i className={iconClass}></i>
        <h3>{title}</h3>
      </div>
      <p className={`value ${animate ? "value-updated" : ""}`}>{value}</p>
      <p className="unit">{unit}</p>
    </div>
  );
};

export default SensorCard;

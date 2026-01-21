import React from "react";

interface ResultIconProps {
  type: "pie" | "grid" | "bar";
}

export const ResultIcon: React.FC<ResultIconProps> = ({ type }) => {
  // Используем цвета дизайн-системы: черный для заполненных элементов
  const primaryColor = "hsl(var(--color-ink))"; // Черный
  const secondaryColor = "hsl(var(--color-ink) / 0.3)"; // Полупрозрачный черный

  if (type === "pie") {
    // Круговая диаграмма для 80% с разрывом в 20%
    const circumference = 2 * Math.PI * 40; // ≈ 251.33
    const filled = circumference * 0.8; // 80% заполнено
    const gap = circumference * 0.2; // 20% разрыв
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={primaryColor}
          strokeWidth="8"
          strokeDasharray={`${filled} ${gap}`}
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "grid") {
    // Сетка из 4 точек для 3 из 4
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        {/* Верхний левый */}
        <circle cx="30" cy="30" r="12" fill={primaryColor} />
        {/* Верхний правый */}
        <circle cx="70" cy="30" r="12" fill={primaryColor} />
        {/* Нижний левый */}
        <circle cx="30" cy="70" r="12" fill={primaryColor} />
        {/* Нижний правый - пунктирный */}
        <circle
          cx="70"
          cy="70"
          r="12"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="3"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  if (type === "bar") {
    // Столбчатая диаграмма для 61%
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        {/* Высокий столбец (61%) */}
        <rect
          x="20"
          y="20"
          width="30"
          height="60"
          fill={primaryColor}
          rx="4"
        />
        {/* Низкий столбец (39%) */}
        <rect
          x="60"
          y="60"
          width="30"
          height="20"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="3"
          strokeDasharray="4 4"
          rx="4"
        />
      </svg>
    );
  }

  return null;
};







import React from "react";

interface AwardBadgeProps {
  award: string;
  source: string;
}

export const AwardBadge: React.FC<AwardBadgeProps> = ({ award, source }) => {
  return (
    <div className="landing-award-badge">
      <svg
        className="landing-award-icon"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Лавровый венок */}
        <path
          d="M 20 50 Q 30 20 50 20 Q 70 20 80 50 Q 70 80 50 80 Q 30 80 20 50 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Листья */}
        <path
          d="M 30 40 Q 35 30 40 35 Q 35 40 30 40"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 70 40 Q 65 30 60 35 Q 65 40 70 40"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 30 60 Q 35 70 40 65 Q 35 60 30 60"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 70 60 Q 65 70 60 65 Q 65 60 70 60"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div className="landing-award-text">{award}</div>
      <div className="landing-award-source">{source}</div>
    </div>
  );
};







import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  dotColor?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [3, 5, 2, 8, 6, 9, 7],
  width = 96,
  height = 28,
  lineColor = '#A8A29E', // Stone-400 grey sparkline
  dotColor = '#0F172A', // Primary colour endpoint dot
  className = '',
}) => {
  if (!data || data.length < 2) {
    data = [2, 4, 3, 6, 5, 8, 7];
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * usableWidth;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x},${point.y}` : `${acc} L ${point.x},${point.y}`;
  }, '');

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={dotColor}
          className="transition-all duration-300"
        />
      )}
    </svg>
  );
};

import React from 'react';
import { Sparkline } from './Sparkline';

interface StatCardProps {
  label: string;
  value: number | string;
  deltaText?: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  deltaText = '↑ 2 vs yesterday',
  sparklineData = [3, 5, 4, 7, 6, 9, 8],
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280]">
          {label}
        </div>

        {isLoading ? (
          <div className="h-7 w-20 bg-[#F5F5F4] animate-pulse rounded mt-1.5 mb-1" />
        ) : (
          <div className="text-[24px] font-semibold leading-tight text-[#1C1917] tabular-nums mt-1">
            {value}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[#F5F5F4] flex items-center justify-between">
        <span className="text-[12px] text-[#78716C] font-normal font-sans">
          {deltaText}
        </span>
        <Sparkline data={sparklineData} width={80} height={22} />
      </div>
    </div>
  );
};

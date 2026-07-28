import React, { useMemo } from 'react';
import { Booking } from '../types';
import { BRAND } from '../lib/branding';
import { getServiceType } from '../lib/dateUtils';

interface ChartsProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ bookings, isLoading = false }) => {
  // 1. Compute Bookings by Hour (for hours 8:00 AM to 8:00 PM IST)
  const hourlyData = useMemo(() => {
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const counts: Record<number, number> = {};
    hours.forEach((h) => (counts[h] = 0));

    bookings.forEach((b) => {
      if (!b.slot_datetime) return;
      try {
        const d = new Date(b.slot_datetime);
        // Convert to IST hour
        const hourStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          hour12: false,
        }).format(d);
        const hour = parseInt(hourStr, 10);
        if (counts[hour] !== undefined) {
          counts[hour]++;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return hours.map((h) => {
      const displayLabel =
        h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
      const count = counts[h] || 0;
      const heightPercent = count === 0 ? 0 : Math.max(12, Math.round((count / maxCount) * 100));
      return { hour: h, label: displayLabel, count, heightPercent };
    });
  }, [bookings]);

  // 2. Compute Department Load
  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      const dept = getServiceType(b);
      counts[dept] = (counts[dept] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = bookings.length || 1;

    // Take top 5 departments
    return entries.slice(0, 5).map(([dept, count]) => {
      const percentage = Math.round((count / total) * 100);
      return { department: dept, count, percentage };
    });
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-lg border border-[#E7E5E4] p-4 h-64 animate-pulse" />
        <div className="lg:col-span-5 bg-white rounded-lg border border-[#E7E5E4] p-4 h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Bookings by Hour - Hand-rolled SVG Bar Chart */}
      <div className="lg:col-span-7 bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F4]">
          <div>
            <h3 className="text-[13px] font-semibold text-[#1C1917]">{BRAND.appointmentLabelPlural} by Hour</h3>
            <p className="text-[11px] text-[#78716C] font-normal">{BRAND.appointmentLabel} density across operating hours (IST)</p>
          </div>
          <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-[0.06em]">
            Peak Hours
          </span>
        </div>

        <div className="pt-4 pb-2">
          {/* Hairline Grid lines */}
          <div className="relative h-36 flex items-end justify-between gap-1 border-b border-[#E7E5E4] px-1">
            <div className="absolute inset-x-0 top-0 border-b border-dashed border-[#F5F5F4]" />
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#F5F5F4]" />

            {hourlyData.map((item) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#1C1917] text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 font-mono">
                  {item.label}: {item.count} slots
                </div>

                {/* Bar */}
                {item.count > 0 ? (
                  <div
                    style={{ height: `${item.heightPercent}%` }}
                    className="w-[16px] bg-[#0F172A] rounded-t-sm transition-all duration-300 group-hover:bg-[#D97706]"
                  />
                ) : (
                  <div className="w-[16px] h-1.5 bg-[#E7E5E4] rounded-t-sm" />
                )}
              </div>
            ))}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between gap-1 px-1 mt-2 text-[10px] text-[#78716C] font-mono">
            {hourlyData.map((item) => (
              <div key={item.hour} className="flex-1 text-center truncate">
                {item.label.replace(' ', '')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Load - Hand-rolled 4px track progress bars */}
      <div className="lg:col-span-5 bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
        <div className="pb-3 border-b border-[#F5F5F4]">
          <h3 className="text-[13px] font-semibold text-[#1C1917]">{BRAND.groupLabel} Load</h3>
          <p className="text-[11px] text-[#78716C] font-normal">{BRAND.appointmentLabel} volume distributed by {BRAND.groupLabel.toLowerCase()}</p>
        </div>

        <div className="space-y-3.5 my-auto py-2">
          {departmentData.length === 0 ? (
            <p className="text-[12px] text-[#78716C] text-center py-6">No {BRAND.groupLabel.toLowerCase()} data available</p>
          ) : (
            departmentData.map((item) => (
              <div key={item.department} className="space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#1C1917] truncate max-w-[200px]">
                    {item.department}
                  </span>
                  <span className="font-mono text-[#78716C] tabular-nums font-normal">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                {/* 4px track with primary fill */}
                <div className="w-full h-[4px] bg-[#E7E5E4] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    className="h-full bg-[#0F172A] rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

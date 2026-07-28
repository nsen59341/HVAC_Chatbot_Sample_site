import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toLowerCase().trim();

  let styles = 'bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]';
  let label = status || 'Unknown';

  if (normalized === 'booked') {
    styles = 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]';
    label = 'Booked';
  } else if (normalized === 'rescheduled') {
    styles = 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
    label = 'Rescheduled';
  } else if (normalized === 'cancelled' || normalized === 'canceled') {
    styles = 'bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]';
    label = 'Cancelled';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium border font-sans leading-none ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

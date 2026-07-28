import React from 'react';

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-2 p-4 animate-pulse">
      <div className="h-8 bg-[#F5F5F4] rounded w-full mb-4" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-11 bg-[#FAFAF9] border border-[#E7E5E4] rounded flex items-center px-4 gap-4">
          <div className="h-4 bg-[#E7E5E4] rounded w-1/5" />
          <div className="h-4 bg-[#E7E5E4] rounded w-1/6" />
          <div className="h-4 bg-[#E7E5E4] rounded w-1/6" />
          <div className="h-4 bg-[#E7E5E4] rounded w-1/6" />
          <div className="h-4 bg-[#E7E5E4] rounded w-1/6" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-pulse space-y-3">
      <div className="h-3 bg-[#E7E5E4] rounded w-1/3" />
      <div className="h-7 bg-[#F5F5F4] rounded w-1/2" />
      <div className="h-3 bg-[#E7E5E4] rounded w-2/3" />
    </div>
  );
};

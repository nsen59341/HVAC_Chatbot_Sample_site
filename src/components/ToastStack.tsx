import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3 rounded-lg border shadow-lg flex items-center justify-between text-[12px] font-medium transition-all duration-200 ${
            t.type === 'success'
              ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
              : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
            )}
            <span className="truncate">{t.message}</span>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded hover:bg-black/5 shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  );
};

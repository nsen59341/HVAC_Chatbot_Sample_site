import React, { useState } from 'react';
import { Booking } from '../types';
import { BRAND } from '../lib/branding';
import { formatIST, getSlotDatetime } from '../lib/dateUtils';
import { AlertTriangle, X, Ban } from 'lucide-react';

interface CancelBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Customer requested cancellation',
  'Technician unavailable / rescheduled',
  'Duplicate booking entry',
  'Customer issue resolved independently',
  'Address outside service coverage zone',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setErrorMsg('Please enter or select a cancellation reason.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirm(booking.id, trimmed);
      setReason('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to cancel booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-[#E7E5E4] z-10 overflow-hidden text-[#1C1917]">
        {/* Modal Header */}
        <div className="p-4 bg-[#FEF2F2] border-b border-[#FEE2E2] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#B91C1C]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-[15px] font-semibold">Cancel {BRAND.appointmentLabel}</h3>
              <p className="text-[11px] text-[#991B1B] font-mono">ID: {booking.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Target Booking Info Card */}
          <div className="bg-[#FAFAF9] rounded-md p-3 border border-[#E7E5E4] text-[12px] space-y-1">
            <div className="flex justify-between font-semibold text-[#1C1917]">
              <span>{booking.patient_name || BRAND.entityLabel}</span>
              <span className="font-mono font-normal text-[#78716C]">{booking.phone || ''}</span>
            </div>
            <div className="text-[#78716C] font-mono">
              Slot: <span className="text-[#1C1917] font-medium">{formatIST(getSlotDatetime(booking))}</span>
            </div>
          </div>

          {/* Cancellation Reason Prompt */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[#1C1917]">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_REASONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setReason(preset);
                    setErrorMsg('');
                  }}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                    reason === preset
                      ? 'bg-[#B91C1C] text-white border-[#B91C1C] font-medium'
                      : 'bg-[#FAFAF9] text-[#44403C] border-[#E7E5E4] hover:bg-[#F5F5F4]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              rows={3}
              placeholder="Specify the reason why this booking is being cancelled..."
              className="w-full px-3 py-2 bg-white border border-[#E7E5E4] rounded-md text-[13px] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              required
            />

            {errorMsg && (
              <p className="text-[11px] font-medium text-[#B91C1C]">{errorMsg}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#E7E5E4] text-[12px] font-medium text-[#44403C] hover:bg-[#FAFAF9] transition-colors"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md bg-[#B91C1C] text-white text-[12px] font-medium hover:bg-[#991B1B] transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

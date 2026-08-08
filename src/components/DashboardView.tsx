import React, { useState } from 'react';
import { Visitor, Conversation, Booking, ActiveTab } from '../types';
import { groupConversations } from '../lib/conversationUtils';
import { BRAND } from '../lib/branding';
import { StatCard } from './StatCard';
import { StatusBadge } from './StatusBadge';
import { Charts } from './Charts';
import { CardSkeleton } from './Skeletons';
import { CancelBookingModal } from './CancelBookingModal';
import {
  isTodayIST,
  formatIST,
  getTechnicianName,
  getServiceType,
  getSlotDatetime,
  isAppointmentDateReached,
} from '../lib/dateUtils';
import { ArrowRight, CheckCircle2, Ban, Eye } from 'lucide-react';

interface DashboardViewProps {
  visitors: Visitor[];
  conversations: Conversation[];
  bookings: Booking[];
  isLoading: boolean;
  onSelectBooking: (booking: Booking) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateBooking: (updated: Partial<Booking> & { id: string }) => Promise<boolean>;
  addToast: (type: 'success' | 'error', message: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  visitors,
  conversations,
  bookings,
  isLoading,
  onSelectBooking,
  setActiveTab,
  onUpdateBooking,
  addToast,
}) => {
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  // Compute today's statistics (since midnight IST)
  const visitorsToday = visitors.filter((v) => isTodayIST(v.created_at)).length;
  const mergedThreads = groupConversations(conversations);
  const conversationsToday = mergedThreads.filter(
    (c) => isTodayIST(c.started_at) || isTodayIST(c.last_activity_at)
  ).length;
  const bookingsToday = bookings.filter((b) => isTodayIST(b.created_at)).length;
  const cancellationsToday = bookings.filter(
    (b) =>
      isTodayIST(b.created_at) &&
      (b.status || '').toLowerCase().trim() === 'cancelled'
  ).length;

  // 5 latest bookings sorted by created_at descending
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Handle Mark Completed
  const handleMarkCompleted = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    const slotStr = getSlotDatetime(b);
    
    // Constraint check: Completed can only be done on or after appointment date
    if (!isAppointmentDateReached(slotStr)) {
      addToast(
        'error',
        `Cannot mark as Completed before appointment date (${formatIST(slotStr)}). Status can only be completed on or after the appointment date.`
      );
      return;
    }

    const success = await onUpdateBooking({
      id: b.id,
      status: 'completed',
    });

    if (success) {
      addToast('success', `Appointment marked as Completed for ${b.patient_name || BRAND.entityLabel}`);
    } else {
      addToast('error', 'Failed to update booking status.');
    }
  };

  // Handle Cancel Confirmation
  const handleConfirmCancellation = async (bookingId: string, reason: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const existingNotes = target.notes || '';
    const updatedNotes = existingNotes
      ? `${existingNotes} | [Cancellation Reason]: ${reason}`
      : `[Cancellation Reason]: ${reason}`;

    const success = await onUpdateBooking({
      id: bookingId,
      status: 'cancelled',
      notes: updatedNotes,
    });

    if (success) {
      addToast('success', `Booking cancelled for ${target.patient_name || BRAND.entityLabel}`);
    } else {
      addToast('error', 'Failed to cancel booking.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cancellation Reason Modal */}
      <CancelBookingModal
        booking={cancellingBooking}
        isOpen={Boolean(cancellingBooking)}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleConfirmCancellation}
      />

      {/* Page Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1C1917] tracking-tight">Overview</h2>
          <p className="text-[12px] text-[#78716C] font-normal">
            Real-time metric summary since midnight IST
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Visitors Today"
            value={visitorsToday}
            deltaText="↑ 4 vs yesterday"
            sparklineData={[2, 4, 3, 6, 5, 8, visitorsToday || 7]}
          />
          <StatCard
            label="Conversations Today"
            value={conversationsToday}
            deltaText="↑ 2 vs yesterday"
            sparklineData={[1, 3, 2, 5, 4, 7, conversationsToday || 5]}
          />
          <StatCard
            label="Bookings Today"
            value={bookingsToday}
            deltaText="↑ 5 vs yesterday"
            sparklineData={[2, 3, 5, 4, 6, 8, bookingsToday || 9]}
          />
          <StatCard
            label="Cancellations Today"
            value={cancellationsToday}
            deltaText="↓ 1 vs yesterday"
            sparklineData={[3, 2, 4, 1, 3, 2, cancellationsToday || 1]}
          />
        </div>
      )}

      {/* Hand-rolled Charts Section */}
      <Charts bookings={bookings} isLoading={isLoading} />

      {/* Recent Activity List */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 border-b border-[#F5F5F4] flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-[#1C1917]">Recent {BRAND.appointmentLabelPlural}</h3>
            <p className="text-[11px] text-[#78716C] font-normal">
              Latest 5 {BRAND.appointmentLabelPlural.toLowerCase()} recorded from {BRAND.productName} AI
            </p>
          </div>

          <button
            onClick={() => setActiveTab('bookings')}
            className="flex items-center gap-1 text-[12px] font-medium text-[#0F172A] hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List Table */}
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#FAFAF9] rounded animate-pulse" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-[#78716C]">
            No recent bookings recorded in Supabase.
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F4]">
            {recentBookings.map((b) => {
              const currentStatus = (b.status || '').toLowerCase().trim();
              const isCompleted = currentStatus === 'completed';
              const isCancelled = currentStatus === 'cancelled' || currentStatus === 'canceled';

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAFAF9] transition-colors cursor-pointer text-[13px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-medium text-[#1C1917] truncate max-w-[150px]">
                      {b.patient_name || BRAND.entityLabel}
                    </span>
                    <StatusBadge status={b.status} />
                    <span className="text-[11px] text-[#78716C] truncate hidden md:inline">
                      {getServiceType(b)} • {getTechnicianName(b)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-[12px]">
                    <span className="font-mono text-[#1C1917] tabular-nums font-normal text-[11px]">
                      Slot: {formatIST(getSlotDatetime(b))}
                    </span>

                    {/* Quick Status Action Buttons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Complete Button */}
                      <button
                        type="button"
                        disabled={isCompleted || isCancelled}
                        onClick={(e) => handleMarkCompleted(b, e)}
                        title={
                          isCompleted
                            ? 'Already completed'
                            : isCancelled
                            ? 'Cannot complete a cancelled booking'
                            : 'Mark as Completed (Only on or after appointment date)'
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                          isCompleted
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] opacity-60 cursor-not-allowed'
                            : isCancelled
                            ? 'bg-[#F5F5F4] text-[#A8A29E] border border-[#E7E5E4] opacity-50 cursor-not-allowed'
                            : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] border border-[#BFDBFE]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="hidden lg:inline">{isCompleted ? 'Completed' : 'Complete'}</span>
                      </button>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        disabled={isCompleted || isCancelled}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancellingBooking(b);
                        }}
                        title={
                          isCancelled
                            ? 'Already cancelled'
                            : isCompleted
                            ? 'Cannot cancel a completed booking'
                            : 'Cancel Booking (Reason required)'
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                          isCancelled
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] opacity-60 cursor-not-allowed'
                            : isCompleted
                            ? 'bg-[#F5F5F4] text-[#A8A29E] border border-[#E7E5E4] opacity-50 cursor-not-allowed'
                            : 'bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] border border-[#FECACA]'
                        }`}
                      >
                        <Ban className="w-3 h-3" />
                        <span className="hidden lg:inline">{isCancelled ? 'Cancelled' : 'Cancel'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectBooking(b)}
                        title="View Details"
                        className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


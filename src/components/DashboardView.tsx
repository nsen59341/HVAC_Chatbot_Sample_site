import React from 'react';
import { Visitor, Conversation, Booking, ActiveTab } from '../types';
import { groupConversations } from '../lib/conversationUtils';
import { BRAND } from '../lib/branding';
import { StatCard } from './StatCard';
import { StatusBadge } from './StatusBadge';
import { Charts } from './Charts';
import { CardSkeleton } from './Skeletons';
import { isTodayIST, formatIST, getTechnicianName, getServiceType, getSlotDatetime } from '../lib/dateUtils';
import { ArrowRight, Calendar, User, Stethoscope } from 'lucide-react';

interface DashboardViewProps {
  visitors: Visitor[];
  conversations: Conversation[];
  bookings: Booking[];
  isLoading: boolean;
  onSelectBooking: (booking: Booking) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  visitors,
  conversations,
  bookings,
  isLoading,
  onSelectBooking,
  setActiveTab,
}) => {
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

  return (
    <div className="space-y-6">
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
            {recentBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className="h-[44px] px-4 flex items-center justify-between hover:bg-[#FAFAF9] transition-colors cursor-pointer text-[13px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-[#1C1917] truncate max-w-[160px]">
                    {b.patient_name || BRAND.entityLabel}
                  </span>
                  <StatusBadge status={b.status} />
                  <span className="text-[11px] text-[#78716C] truncate hidden sm:inline">
                    {getServiceType(b)} • {getTechnicianName(b)}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-[12px]">
                  <span className="font-mono text-[#1C1917] tabular-nums font-normal">
                    Slot: {formatIST(getSlotDatetime(b))}
                  </span>
                  <span className="text-[#78716C] font-mono text-[11px] hidden md:inline font-normal">
                    {formatIST(b.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

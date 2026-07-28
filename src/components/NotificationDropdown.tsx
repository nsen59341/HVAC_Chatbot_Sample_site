import React, { useState } from 'react';
import { Booking } from '../types';
import { BRAND } from '../lib/branding';
import { getTechnicianName, getServiceType, getSlotDatetime, formatIST, isWithinLastHour } from '../lib/dateUtils';
import { Bell, Check, Calendar, ArrowRight } from 'lucide-react';

interface NotificationDropdownProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  bookings,
  onSelectBooking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Recent bookings within last 24 hours
  const recentBookings = bookings.slice(0, 8);

  // Unread count: bookings in last hour that aren't marked read
  const unreadCount = recentBookings.filter(
    (b) => isWithinLastHour(b.created_at) && !readIds.has(b.id)
  ).length;

  const markAllRead = () => {
    const newRead = new Set(readIds);
    recentBookings.forEach((b) => newRead.add(b.id));
    setReadIds(newRead);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md hover:bg-[#F5F5F4] text-[#1C1917] border border-[#E7E5E4] relative transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#1C1917]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B91C1C] text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-30" />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-[#E7E5E4] shadow-lg z-40 text-[#1C1917] overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
              <div className="text-[12px] font-semibold text-[#1C1917] flex items-center gap-2">
                <span>Recent Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-mono font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={markAllRead}
                className="text-[11px] text-[#78716C] hover:text-[#1C1917] font-normal"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#F5F5F4]">
              {recentBookings.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[#78716C]">
                  No recent {BRAND.appointmentLabel.toLowerCase()} activity
                </div>
              ) : (
                recentBookings.map((b) => {
                  const isRead = readIds.has(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        const next = new Set(readIds);
                        next.add(b.id);
                        setReadIds(next);
                        onSelectBooking(b);
                        setIsOpen(false);
                      }}
                      className={`p-3 text-[12px] cursor-pointer hover:bg-[#FAFAF9] transition-colors flex items-start justify-between gap-2 ${
                        !isRead ? 'bg-[#F5F5F4]/50 font-medium' : ''
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1C1917] truncate">
                            {b.patient_name || BRAND.entityLabel}
                          </span>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#78716C] font-normal truncate">
                          {getServiceType(b)} • {getTechnicianName(b)}
                        </div>
                        <div className="text-[10px] text-[#A8A29E] font-mono font-normal">
                          Slot: {formatIST(getSlotDatetime(b))}
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-1" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

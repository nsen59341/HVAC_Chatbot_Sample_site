import React, { useState, useMemo } from 'react';
import { Booking, BookingFilterStatus, DateRangeFilter, SortField, SortOrder } from '../types';
import { BRAND } from '../lib/branding';
import { StatusBadge } from './StatusBadge';
import { TableSkeleton } from './Skeletons';
import { CancelBookingModal } from './CancelBookingModal';
import {
  formatIST,
  getTechnicianName,
  getServiceType,
  getSlotDatetime,
  isTodayIST,
  isWithinDaysIST,
  isAppointmentDateReached,
} from '../lib/dateUtils';
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Ban,
  Eye,
} from 'lucide-react';

interface BookingsViewProps {
  bookings: Booking[];
  isLoading: boolean;
  onSelectBooking: (booking: Booking) => void;
  selectedLocation: string;
  onExportCSV: (bookingsToExport: Booking[]) => void;
  onUpdateBooking: (updated: Partial<Booking> & { id: string }) => Promise<boolean>;
  addToast: (type: 'success' | 'error', message: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  isLoading,
  onSelectBooking,
  selectedLocation,
  onExportCSV,
  onUpdateBooking,
  addToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<BookingFilterStatus>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: bookings.length, booked: 0, rescheduled: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      const st = (b.status || '').toLowerCase().trim();
      if (st === 'booked') counts.booked++;
      else if (st === 'rescheduled') counts.rescheduled++;
      else if (st === 'completed') counts.completed++;
      else if (st === 'cancelled' || st === 'canceled') counts.cancelled++;
    });
    return counts;
  }, [bookings]);

  // Filtered & Searched Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Location filter (matching notes or location string)
      if (selectedLocation !== 'All') {
        const notes = (b.notes || '').toLowerCase();
        const dept = (b.department || '').toLowerCase();
        const locQuery = selectedLocation.toLowerCase();
        if (!notes.includes(locQuery) && !dept.includes(locQuery)) {
          // If notes or department don't match location, skip
        }
      }

      // Status filter
      if (filterStatus !== 'all') {
        const st = (b.status || '').toLowerCase().trim();
        if (filterStatus === 'cancelled') {
          if (st !== 'cancelled' && st !== 'canceled') return false;
        } else if (st !== filterStatus) {
          return false;
        }
      }

      // Date range filter
      const slotVal = b.appointment_datetime || b.slot_datetime || (b as any).slot || (b as any).slot_time;

      if (dateRange === 'today') {
        if (!isTodayIST(b.created_at) && !isTodayIST(slotVal)) return false;
      } else if (dateRange === '7days') {
        if (!isWithinDaysIST(b.created_at, 7) && !isWithinDaysIST(slotVal, 7)) return false;
      }

      // Search box query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const patientName = (b.patient_name || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const email = (b.email || '').toLowerCase();
        const doctor = getTechnicianName(b).toLowerCase();
        const department = getServiceType(b).toLowerCase();
        const slotStr = formatIST(getSlotDatetime(b)).toLowerCase();

        return (
          patientName.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          doctor.includes(q) ||
          department.includes(q) ||
          slotStr.includes(q)
        );
      }

      return true;
    });
  }, [bookings, filterStatus, dateRange, searchQuery, selectedLocation]);

  // Handle Mark Completed
  const handleMarkCompleted = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    const slotStr = getSlotDatetime(b);

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

  // Sorted Bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'created_at') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else if (sortField === 'slot_datetime') {
        valA = new Date(a.appointment_datetime || a.slot_datetime || (a as any).slot || (a as any).slot_time).getTime() || 0;
        valB = new Date(b.appointment_datetime || b.slot_datetime || (b as any).slot || (b as any).slot_time).getTime() || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBookings, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#A8A29E]" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#0F172A]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#0F172A]" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Cancellation Reason Modal */}
      <CancelBookingModal
        booking={cancellingBooking}
        isOpen={Boolean(cancellingBooking)}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleConfirmCancellation}
      />

      {/* Controls Bar */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${BRAND.entityLabel.toLowerCase()}, phone, ${BRAND.ownerLabel.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-md text-[12px] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#78716C] hover:text-[#1C1917]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Rows & Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center bg-[#FAFAF9] p-0.5 rounded-md border border-[#E7E5E4]">
            {(
              [
                { id: 'all', label: 'All', count: statusCounts.all },
                { id: 'booked', label: 'Booked', count: statusCounts.booked },
                { id: 'rescheduled', label: 'Rescheduled', count: statusCounts.rescheduled },
                { id: 'completed', label: 'Completed', count: statusCounts.completed },
                { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
              ] as const
            ).map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-[#1C1917] shadow-2xs font-semibold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center bg-[#FAFAF9] p-0.5 rounded-md border border-[#E7E5E4]">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((range) => {
              const isActive = dateRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-2xs font-semibold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() => onExportCSV(sortedBookings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] text-[12px] font-medium text-[#1C1917] transition-colors shadow-2xs"
            title="Export current view as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : sortedBookings.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[#78716C] px-4">
            No {BRAND.entityLabel.toLowerCase()} {BRAND.appointmentLabelPlural.toLowerCase()} found matching the selected filter or search query.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#FAFAF9] text-[#6B7280] border-b border-[#E7E5E4] text-[11px] font-medium uppercase tracking-[0.06em] sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => handleSort('patient_name')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-[#F5F5F4] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>{BRAND.entityLabel}</span>
                      {renderSortIndicator('patient_name')}
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">{BRAND.groupLabel}</th>
                  <th
                    onClick={() => handleSort('doctor')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-[#F5F5F4] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>{BRAND.ownerLabel}</span>
                      {renderSortIndicator('doctor')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('slot_datetime')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-[#F5F5F4] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Slot (IST)</span>
                      {renderSortIndicator('slot_datetime')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-[#F5F5F4] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('created_at')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-[#F5F5F4] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Booked On</span>
                      {renderSortIndicator('created_at')}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {sortedBookings.map((b) => {
                  const currentStatus = (b.status || '').toLowerCase().trim();
                  const isCompleted = currentStatus === 'completed';
                  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'canceled';

                  return (
                    <tr
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="h-[44px] hover:bg-[#FAFAF9] transition-colors cursor-pointer group"
                    >
                      {/* Patient */}
                      <td className="py-2 px-4 truncate max-w-[180px]">
                        <div className="font-normal text-[#1C1917] truncate">
                          {b.patient_name || BRAND.entityLabel}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-2 px-3 font-mono text-[#78716C] tabular-nums truncate max-w-[120px] font-normal">
                        {b.phone || '-'}
                      </td>

                      {/* Department */}
                      <td className="py-2 px-3 text-[#1C1917] truncate max-w-[140px] font-normal">
                        {getServiceType(b)}
                      </td>

                      {/* Technician */}
                      <td className="py-2 px-3 text-[#1C1917] truncate max-w-[160px] font-medium">
                        {getTechnicianName(b)}
                      </td>

                      {/* Slot in IST */}
                      <td className="py-2 px-3 font-mono text-[#1C1917] tabular-nums whitespace-nowrap font-medium">
                        {formatIST(getSlotDatetime(b))}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Booked on */}
                      <td className="py-2 px-3 font-mono text-[#78716C] text-[12px] tabular-nums whitespace-nowrap font-normal">
                        {formatIST(b.created_at)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-2 px-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
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
                                : 'Mark as Completed (Only allowed on/after appointment date)'
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
                            <span className="hidden xl:inline">{isCompleted ? 'Completed' : 'Complete'}</span>
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
                            <span className="hidden xl:inline">{isCancelled ? 'Cancelled' : 'Cancel'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectBooking(b)}
                            title="View / Edit Details"
                            className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

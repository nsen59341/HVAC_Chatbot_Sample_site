import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { BRAND } from '../lib/branding';
import {
  cleanDoctorName,
  getTechnicianName,
  getServiceType,
  getSlotDatetime,
  formatISTFull,
  formatForDateTimeLocalInput,
  dateTimeLocalToISTISO,
} from '../lib/dateUtils';
import { triggerRescheduleWebhook, triggerNotifyWebhook } from '../lib/webhook';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Calendar,
  User,
  Phone,
  Mail,
  Wrench,
  Building2,
  Bell,
  Clock,
  Send,
  Save,
  FileText,
  Fan,
} from 'lucide-react';

interface BookingDrawerProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateBooking: (updated: Partial<Booking> & { id: string }) => Promise<boolean>;
  addToast: (type: 'success' | 'error', message: string) => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  booking,
  onClose,
  onUpdateBooking,
  addToast,
}) => {
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [slotDatetimeLocal, setSlotDatetimeLocal] = useState('');
  const [status, setStatus] = useState<string>('booked');
  const [notes, setNotes] = useState('');

  const [customNotifyMsg, setCustomNotifyMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  useEffect(() => {
    if (booking) {
      setDepartment(getServiceType(booking));
      setDoctor(getTechnicianName(booking));
      const slot = getSlotDatetime(booking);
      setSlotDatetimeLocal(formatForDateTimeLocalInput(slot));
      setStatus(booking.status || 'booked');
      setNotes(booking.notes || '');
      setCustomNotifyMsg('');
    }
  }, [booking]);

  if (!booking) return null;

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isoSlot = dateTimeLocalToISTISO(slotDatetimeLocal);
      const cleanedDoctor = cleanDoctorName(doctor);

      // 1. Update Supabase
      const success = await onUpdateBooking({
        id: booking.id,
        department,
        service_type: department,
        service: department,
        doctor: cleanedDoctor,
        technician: cleanedDoctor,
        slot_datetime: isoSlot,
        appointment_datetime: isoSlot,
        status: 'rescheduled',
        notes,
      });

      if (success) {
        // 2. Trigger Reschedule Webhook
        await triggerRescheduleWebhook({
          id: booking.id,
          patient_name: booking.patient_name,
          phone: booking.phone,
          email: booking.email,
          department,
          doctor: cleanedDoctor,
          slot_datetime: isoSlot,
          status: 'rescheduled',
          notes,
        });

        addToast('success', `${BRAND.appointmentLabel} rescheduled for ${booking.patient_name}`);
        onClose();
      } else {
        addToast('error', 'Failed to update booking in Supabase');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Error saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNotification = async () => {
    if (!customNotifyMsg.trim()) {
      addToast('error', 'Please enter a notification message');
      return;
    }

    setIsSendingNotify(true);
    try {
      await triggerNotifyWebhook({
        id: booking.id,
        patient_name: booking.patient_name,
        phone: booking.phone,
        message: customNotifyMsg,
        doctor: cleanDoctorName(booking.doctor),
        slot_datetime: booking.slot_datetime,
      });

      addToast('success', `Notification sent to ${booking.phone}`);
      setCustomNotifyMsg('');
    } catch (e: any) {
      addToast('error', 'Failed to dispatch notification');
    } finally {
      setIsSendingNotify(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" />

      {/* Drawer Card */}
      <div className="relative w-full max-w-md bg-white border-l border-[#E7E5E4] shadow-2xl z-10 flex flex-col h-full text-[#1C1917]">
        {/* Header */}
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fan className="w-4 h-4 text-[#D97706]" />
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1917]">{BRAND.appointmentLabel} Details</h3>
              <p className="text-[11px] text-[#78716C] font-mono">ID: {booking.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[13px]">
          {/* Customer Header Box */}
          <div className="bg-[#FAFAF9] rounded-lg border border-[#E7E5E4] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[15px] text-[#1C1917]">
                {booking.patient_name || BRAND.entityLabel}
              </span>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px] text-[#78716C]">
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-[#0F172A]" />
                <span className="font-mono text-[#1C1917]">{booking.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#0F172A]" />
                <span className="truncate">{booking.email || 'No email'}</span>
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <form onSubmit={handleSaveReschedule} className="space-y-3.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280]">
              Reschedule & Edit Dispatch
            </div>

            {/* Department / Service Type */}
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">{BRAND.groupLabel} Type</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. AC Repair / Heating System Maintenance"
                className="w-full px-3 py-1.5 bg-white border border-[#E7E5E4] rounded-md text-[13px] text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                required
              />
            </div>

            {/* Technician */}
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">Assigned {BRAND.ownerLabel}</label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="e.g. Rajesh Kumar (Senior Tech)"
                className="w-full px-3 py-1.5 bg-white border border-[#E7E5E4] rounded-md text-[13px] text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                required
              />
            </div>

            {/* Slot Datetime */}
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">Service Slot Date & Time (IST)</label>
              <input
                type="datetime-local"
                value={slotDatetimeLocal}
                onChange={(e) => setSlotDatetimeLocal(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E7E5E4] rounded-md text-[13px] font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">Address / Issue Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Customer reported cooling coil issue, address Sector 62..."
                className="w-full px-3 py-1.5 bg-white border border-[#E7E5E4] rounded-md text-[12px] text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#0F172A] text-white font-medium text-[13px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Dispatch Details'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

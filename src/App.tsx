import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { BRAND } from './lib/branding';
import { Visitor, Conversation, Booking, ActiveTab, ToastMessage } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BookingsView } from './components/BookingsView';
import { ConversationsView } from './components/ConversationsView';
import { BookingDrawer } from './components/BookingDrawer';
import { CommandPalette } from './components/CommandPalette';
import { WebhookModal } from './components/WebhookModal';
import { ToastStack } from './components/ToastStack';
import { cleanDoctorName, formatISTFull } from './lib/dateUtils';
import { filterByLocation } from './lib/locationUtils';
import { DEFAULT_CONVERSATIONS } from './lib/defaultData';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  // Supabase Live Data State
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modals & Drawers
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState<boolean>(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);

  // Toast stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch data from live Supabase tables
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      // Fetch visitors, conversations, bookings safely
      let conversationsData: any[] = [];
      try {
        const cRes = await supabase.from('conversations').select('*').order('started_at', { ascending: false });
        if (cRes.data && cRes.data.length > 0) {
          conversationsData = cRes.data;
        } else if (cRes.error) {
          // Retry ordering by created_at or without order if started_at fails
          const cRes2 = await supabase.from('conversations').select('*');
          if (cRes2.data) conversationsData = cRes2.data;
        }
      } catch (cErr) {
        console.warn('Failed to fetch conversations from Supabase:', cErr);
      }

      const [visitorsRes, bookingsRes] = await Promise.all([
        supabase.from('visitors').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      ]);

      if (visitorsRes.data) {
        setVisitors(visitorsRes.data as Visitor[]);
      }

      // Normalize & set Conversations
      if (conversationsData && conversationsData.length > 0) {
        const normalizedConvs = conversationsData.map((c, idx) => {
          const custId =
            c.customer_id ||
            c.customerId ||
            c.customer_ID ||
            c.phone ||
            c.customer_name ||
            c.patient_name ||
            c.visitor_id ||
            `CUST-${1001 + idx}`;

          const custName =
            c.customer_name ||
            c.patient_name ||
            c.name ||
            (c.phone ? `Customer (${c.phone})` : `Customer ${custId}`);

          return {
            ...c,
            id: String(c.id || `conv-${idx + 1}`),
            customer_id: String(custId),
            customer_name: String(custName),
            visitor_id: c.visitor_id || `vis-${idx + 1}`,
            started_at: c.started_at || c.created_at || c.timestamp || new Date().toISOString(),
            status: c.status || 'Active',
            transcript: c.transcript || [],
          };
        });
        setConversations(normalizedConvs as Conversation[]);
      } else {
        // Fallback realistic conversations split per customer if Supabase table is empty
        setConversations(DEFAULT_CONVERSATIONS);
      }

      if (bookingsRes.data) {
        const normalized = (bookingsRes.data as any[]).map((b) => ({
          ...b,
          patient_name: b.patient_name || b.customer_name || 'Customer',
          department: b.department || b.service_type || b.service || 'Heating Repair',
          service_type: b.service_type || b.department || b.service || 'Heating Repair',
          doctor: b.doctor || b.technician || b.technician_name || 'Rajesh Kumar',
          technician: b.technician || b.doctor || 'Rajesh Kumar',
          slot_datetime: b.slot_datetime || b.appointment_datetime || b.created_at || new Date().toISOString(),
          appointment_datetime: b.appointment_datetime || b.slot_datetime || b.created_at || new Date().toISOString(),
        }));
        setBookings(normalized as Booking[]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching live Supabase data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and 10s polling interval
  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update a booking in Supabase
  const handleUpdateBooking = async (updated: Partial<Booking> & { id: string }): Promise<boolean> => {
    try {
      const rawDate = updated.appointment_datetime || updated.slot_datetime;
      let isoDate: string | undefined = undefined;
      if (rawDate) {
        const parsed = new Date(rawDate);
        isoDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : rawDate;
      }

      // Build primary update payload for exact Supabase columns:
      // appointment_datetime, technician, service_type, status, notes, customer_name
      const dbUpdateData: Record<string, any> = {};

      if (isoDate) {
        dbUpdateData.appointment_datetime = isoDate;
      }
      if (updated.technician !== undefined || updated.doctor !== undefined) {
        dbUpdateData.technician = updated.technician || updated.doctor;
      }
      if (updated.service_type !== undefined || updated.department !== undefined) {
        dbUpdateData.service_type = updated.service_type || updated.department;
      }
      if (updated.status !== undefined) {
        dbUpdateData.status = updated.status;
      }
      if (updated.notes !== undefined) {
        dbUpdateData.notes = updated.notes;
      }
      if (updated.patient_name !== undefined || (updated as any).customer_name !== undefined) {
        dbUpdateData.customer_name = (updated as any).customer_name || updated.patient_name;
      }

      // First attempt: update appointment_datetime with ISO format
      let { data, error } = await supabase
        .from('bookings')
        .update(dbUpdateData)
        .eq('id', updated.id)
        .select();

      // Fallback attempt if first attempt produced error
      if (error) {
        console.warn('Initial update attempt error:', error.message, '- Trying fallback payloads...');
        
        // Retry 1: Raw date string + slot_datetime
        const fallback1: Record<string, any> = { ...dbUpdateData };
        if (rawDate) {
          fallback1.appointment_datetime = rawDate;
          fallback1.slot_datetime = isoDate || rawDate;
        }

        const res1 = await supabase
          .from('bookings')
          .update(fallback1)
          .eq('id', updated.id)
          .select();

        if (!res1.error && res1.data && res1.data.length > 0) {
          data = res1.data;
          error = null;
        } else {
          // Retry 2: Minimal update on appointment_datetime
          const res2 = await supabase
            .from('bookings')
            .update({
              appointment_datetime: isoDate || rawDate,
              technician: dbUpdateData.technician,
              status: dbUpdateData.status,
            })
            .eq('id', updated.id)
            .select();

          if (!res2.error && res2.data && res2.data.length > 0) {
            data = res2.data;
            error = null;
          }
        }
      }

      if (error) {
        console.error('All Supabase update attempts failed:', error.message);
        return false;
      }

      const updatedRecord = data && data.length > 0 ? data[0] : null;

      // Merge updated fields into local state and normalize standard frontend field names
      const mergedFields = {
        ...updated,
        ...(updatedRecord || {}),
        patient_name: updatedRecord?.customer_name || updated.patient_name || 'Customer',
        department: updatedRecord?.service_type || updated.department || 'Heating Repair',
        service_type: updatedRecord?.service_type || updatedRecord?.department || updated.service_type || 'Heating Repair',
        doctor: updatedRecord?.technician || updated.doctor || 'Rajesh Kumar',
        technician: updatedRecord?.technician || updatedRecord?.doctor || updated.technician || 'Rajesh Kumar',
        slot_datetime: updatedRecord?.appointment_datetime || updatedRecord?.slot_datetime || isoDate || rawDate || updated.slot_datetime,
        appointment_datetime: updatedRecord?.appointment_datetime || updatedRecord?.slot_datetime || isoDate || rawDate || updated.appointment_datetime,
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...mergedFields } : b))
      );

      // Also update selected booking if currently open in drawer
      if (selectedBooking && selectedBooking.id === updated.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...mergedFields } : null));
      }

      return true;
    } catch (e) {
      console.error('Failed to update booking:', e);
      return false;
    }
  };

  // Export filtered CSV function
  const handleExportCSV = (bookingsToExport?: Booking[]) => {
    const data = bookingsToExport || bookings;
    if (data.length === 0) {
      addToast('error', 'No bookings available to export');
      return;
    }

    const headers = ['ID', `${BRAND.entityLabel} Name`, 'Phone', 'Email', BRAND.groupLabel, BRAND.ownerLabel, 'Slot (IST)', 'Status', 'Booked On', 'Notes'];
    const csvRows = [headers.join(',')];

    data.forEach((b) => {
      const row = [
        `"${b.id}"`,
        `"${(b.patient_name || '').replace(/"/g, '""')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        `"${(b.email || '').replace(/"/g, '""')}"`,
        `"${(b.department || '').replace(/"/g, '""')}"`,
        `"${cleanDoctorName(b.doctor || b.technician || (b as any).technician_name).replace(/"/g, '""')}"`,
        `"${formatISTFull(b.appointment_datetime || b.slot_datetime || (b as any).slot || (b as any).slot_time)}"`,
        `"${(b.status || '').replace(/"/g, '""')}"`,
        `"${formatISTFull(b.created_at)}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${BRAND.productName}_${BRAND.appointmentLabelPlural}_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', `Exported ${data.length} records to CSV`);
  };

  const formatLastUpdatedText = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Filtered dataset according to selectedLocation ('All' vs specific city)
  const filteredBookings = useMemo(
    () => filterByLocation(bookings, selectedLocation),
    [bookings, selectedLocation]
  );

  const filteredConversations = useMemo(
    () => filterByLocation(conversations, selectedLocation),
    [conversations, selectedLocation]
  );

  const filteredVisitors = useMemo(
    () => filterByLocation(visitors, selectedLocation),
    [visitors, selectedLocation]
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans antialiased selection:bg-[#0F172A] selection:text-white flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openWebhookSettings={() => setIsWebhookModalOpen(true)}
        isRefreshing={isRefreshing}
        onManualRefresh={() => fetchData(false)}
        lastUpdatedText={formatLastUpdatedText()}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          bookings={filteredBookings}
          onSelectBooking={(b) => setSelectedBooking(b)}
          onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
        />

        {/* View Area */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              visitors={filteredVisitors}
              conversations={filteredConversations}
              bookings={filteredBookings}
              isLoading={isLoading}
              onSelectBooking={(b) => setSelectedBooking(b)}
              setActiveTab={setActiveTab}
              onUpdateBooking={handleUpdateBooking}
              addToast={addToast}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              bookings={filteredBookings}
              isLoading={isLoading}
              onSelectBooking={(b) => setSelectedBooking(b)}
              selectedLocation={selectedLocation}
              onExportCSV={handleExportCSV}
              onUpdateBooking={handleUpdateBooking}
              addToast={addToast}
            />
          )}

          {activeTab === 'conversations' && (
            <ConversationsView conversations={filteredConversations} isLoading={isLoading} />
          )}
        </main>
      </div>

      {/* Right Detail Drawer */}
      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateBooking={handleUpdateBooking}
        addToast={addToast}
      />

      {/* Cmd+K Command Palette */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        bookings={filteredBookings}
        conversations={filteredConversations}
        setActiveTab={setActiveTab}
        onSelectBooking={(b) => setSelectedBooking(b)}
        onExportCSV={() => handleExportCSV()}
        onOpenSettings={() => setIsWebhookModalOpen(true)}
        onRefresh={() => fetchData(false)}
      />

      {/* Webhook Configuration Modal */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        addToast={addToast}
      />

      {/* Toast Stack */}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;

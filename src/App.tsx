import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { BRAND } from './lib/branding';
import { Visitor, Conversation, Booking, ActiveTab, ToastMessage, Technician } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BookingsView } from './components/BookingsView';
import { ConversationsView } from './components/ConversationsView';
import { BookingDrawer } from './components/BookingDrawer';
import { CommandPalette } from './components/CommandPalette';
import { WebhookModal } from './components/WebhookModal';
import { ToastStack } from './components/ToastStack';
import {
  cleanDoctorName,
  formatISTFull,
  DEFAULT_TECHNICIANS,
  DEFAULT_TECHNICIAN_MAP,
  getTechnicianId,
} from './lib/dateUtils';
import { filterByLocation } from './lib/locationUtils';
import { DEFAULT_CONVERSATIONS } from './lib/defaultData';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  // Supabase Live Data State
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [techniciansList, setTechniciansList] = useState<Technician[]>(DEFAULT_TECHNICIANS);

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
        const cRes = await supabase.from('conversations').select('*, customers(*)').order('started_at', { ascending: false });
        if (cRes.data && cRes.data.length > 0) {
          conversationsData = cRes.data;
        } else if (cRes.error) {
          // Retry basic select if joined query had schema issue
          const cRes2 = await supabase.from('conversations').select('*').order('started_at', { ascending: false });
          if (cRes2.data && cRes2.data.length > 0) {
            conversationsData = cRes2.data;
          } else {
            const cRes3 = await supabase.from('conversations').select('*');
            if (cRes3.data) conversationsData = cRes3.data;
          }
        }
      } catch (cErr) {
        console.warn('Failed to fetch conversations from Supabase:', cErr);
      }

      const [visitorsRes, bookingsJoinedRes, techniciansRes] = await Promise.all([
        supabase.from('visitors').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, technicians(*)').order('created_at', { ascending: false }),
        supabase.from('technicians').select('*').order('id', { ascending: true }),
      ]);

      if (visitorsRes.data) {
        setVisitors(visitorsRes.data as Visitor[]);
      }

      if (techniciansRes.data && techniciansRes.data.length > 0) {
        setTechniciansList(techniciansRes.data as Technician[]);
      }

      // If joined bookings query had an issue, fallback to select('*')
      let bookingsData = bookingsJoinedRes.data;
      if (!bookingsData && bookingsJoinedRes.error) {
        console.warn('Joined bookings query failed, falling back to basic select:', bookingsJoinedRes.error.message);
        const fallbackBookingsRes = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (fallbackBookingsRes.data) {
          bookingsData = fallbackBookingsRes.data;
        }
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

          const custAddress = c.customers?.service_address || c.service_address || c.address || null;

          return {
            ...c,
            id: String(c.id || `conv-${idx + 1}`),
            customer_id: String(custId),
            customer_name: String(custName),
            service_address: custAddress,
            address: custAddress,
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

      if (bookingsData) {
        const normalized = (bookingsData as any[]).map((b) => {
          const techId =
            b.technician_id !== undefined && b.technician_id !== null ? Number(b.technician_id) : undefined;
          const techName =
            b.technicians?.name ||
            (techId && DEFAULT_TECHNICIAN_MAP[techId]) ||
            b.technician_name ||
            b.technician ||
            b.doctor ||
            'Rajesh Kumar';

          const svcAddress = b.service_address || b.address || '';

          return {
            ...b,
            service_address: svcAddress,
            address: svcAddress,
            technician_id: techId,
            patient_name: b.patient_name || b.customer_name || 'Customer',
            customer_name: b.customer_name || b.patient_name || 'Customer',
            department: b.department || b.service_type || b.service || 'Heating Repair',
            service_type: b.service_type || b.department || b.service || 'Heating Repair',
            doctor: techName,
            technician: techName,
            slot_datetime: b.slot_datetime || b.appointment_datetime || b.created_at || new Date().toISOString(),
            appointment_datetime: b.appointment_datetime || b.slot_datetime || b.created_at || new Date().toISOString(),
          };
        });
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

      // Resolve technician_id foreign key for Supabase bookings table
      let resolvedTechId: number | undefined = undefined;
      if (updated.technician_id !== undefined && updated.technician_id !== null) {
        const parsed = Number(updated.technician_id);
        if (!isNaN(parsed)) resolvedTechId = parsed;
      } else if (updated.technician || updated.doctor) {
        resolvedTechId = getTechnicianId(updated.technician || updated.doctor);
      }

      // Build primary update payload matching exact Supabase bookings columns:
      // appointment_datetime, customer_name, service_type, service_address, status, notes, technician_id
      // (Supabase changed 'technician' column to foreign key 'technician_id')
      const dbUpdateData: Record<string, any> = {};

      if (isoDate) {
        dbUpdateData.appointment_datetime = isoDate;
      }
      if (resolvedTechId !== undefined) {
        dbUpdateData.technician_id = resolvedTechId;
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
      if (updated.service_address !== undefined) {
        dbUpdateData.service_address = updated.service_address;
      }

      let { data, error } = await supabase
        .from('bookings')
        .update(dbUpdateData)
        .eq('id', updated.id)
        .select();

      // Fallback attempts if first attempt produced an error
      if (error) {
        console.warn('Initial update attempt warning:', error.message, '- Retrying fallback payload...');

        // Fallback 1: omit technician_id in case foreign key check or schema issue
        const fallback1: Record<string, any> = { ...dbUpdateData };
        delete fallback1.technician_id;

        const res1 = await supabase
          .from('bookings')
          .update(fallback1)
          .eq('id', updated.id)
          .select();

        if (!res1.error && res1.data && res1.data.length > 0) {
          data = res1.data;
          error = null;
        } else {
          // Fallback 2: minimal update with status and datetime
          const minimalPayload: Record<string, any> = {
            status: dbUpdateData.status,
          };
          if (isoDate) minimalPayload.appointment_datetime = isoDate;
          if (dbUpdateData.notes !== undefined) minimalPayload.notes = dbUpdateData.notes;

          const res2 = await supabase
            .from('bookings')
            .update(minimalPayload)
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
      const finalTechId =
        updatedRecord?.technician_id !== undefined && updatedRecord?.technician_id !== null
          ? Number(updatedRecord.technician_id)
          : resolvedTechId;
      const finalTechName =
        (finalTechId && DEFAULT_TECHNICIAN_MAP[finalTechId]) ||
        updated.technician ||
        updated.doctor ||
        'Rajesh Kumar';

      // Merge updated fields into local state and normalize standard frontend field names
      const mergedAddress =
        updatedRecord?.service_address ||
        updated.service_address ||
        (updatedRecord as any)?.address ||
        (updated as any).address ||
        '';

      const mergedFields = {
        ...updated,
        ...(updatedRecord || {}),
        service_address: mergedAddress,
        address: mergedAddress,
        technician_id: finalTechId,
        patient_name: updatedRecord?.customer_name || updated.patient_name || 'Customer',
        customer_name: updatedRecord?.customer_name || updated.patient_name || 'Customer',
        department: updatedRecord?.service_type || updated.department || 'Heating Repair',
        service_type: updatedRecord?.service_type || updatedRecord?.department || updated.service_type || 'Heating Repair',
        doctor: finalTechName,
        technician: finalTechName,
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
        techniciansList={techniciansList}
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

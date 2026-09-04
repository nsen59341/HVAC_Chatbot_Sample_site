export interface Visitor {
  id: string;
  created_at: string;
  source: string | null;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system' | string;
  text: string;
}

export interface Conversation {
  id: string;
  visitor_id: string | null;
  customer_id?: string | null;
  started_at: string;
  transcript: TranscriptMessage[] | null;
  status: string | null;
}

export interface Technician {
  id: number;
  name: string;
  phone_number?: string | null;
  created_at?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  patient_name: string;
  customer_name?: string | null;
  phone: string;
  email: string | null;
  department: string | null;
  service_type?: string | null;
  service?: string | null;
  service_address?: string | null;
  address?: string | null;
  doctor: string | null;
  technician?: string | null;
  technician_id?: number | null;
  technicians?: Technician | null;
  slot_datetime: string;
  appointment_datetime?: string | null;
  status: 'booked' | 'rescheduled' | 'completed' | 'cancelled' | string;
  notes: string | null;
}

export type ActiveTab = 'dashboard' | 'bookings' | 'conversations';

export type BookingFilterStatus = 'all' | 'booked' | 'rescheduled' | 'completed' | 'cancelled';

export type DateRangeFilter = 'today' | '7days' | 'all';

export type SortField = 'created_at' | 'slot_datetime' | 'patient_name' | 'doctor' | 'status';

export type SortOrder = 'asc' | 'desc';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export interface NotificationItem {
  id: string;
  booking: Booking;
  read: boolean;
  timestamp: string;
}

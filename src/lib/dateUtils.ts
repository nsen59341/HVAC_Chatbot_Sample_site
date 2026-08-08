/**
 * Time and formatting utility functions for IST (Indian Standard Time, UTC+5:30)
 */

export function cleanDoctorName(doctorStr: string | null | undefined): string {
  if (!doctorStr) return 'Rajesh Kumar';
  // Strip duplicate "Tech.", "Technician", "Dr.", or "Consultant" prefixes if present
  const cleaned = doctorStr.trim().replace(/^(Tech\.\s*|Technician\s*|Dr\.\s*|Dr\s+)+/i, '');
  if (!cleaned || cleaned.toLowerCase() === 'unassigned technician' || cleaned.toLowerCase() === 'unassigned') {
    return 'Rajesh Kumar';
  }
  return cleaned;
}

export function getTechnicianName(booking: any): string {
  if (!booking) return 'Rajesh Kumar';

  if (typeof booking === 'string') {
    return cleanDoctorName(booking);
  }

  const explicit =
    booking.technician ||
    booking.doctor ||
    booking.assigned_technician ||
    booking.technician_name ||
    booking.doctor_name;

  if (explicit && typeof explicit === 'string' && explicit.trim() !== '') {
    const cleaned = explicit.trim().replace(/^(Tech\.\s*|Technician\s*|Dr\.\s*|Dr\s+)+/i, '');
    if (cleaned && cleaned.toLowerCase() !== 'unassigned technician' && cleaned.toLowerCase() !== 'unassigned') {
      return cleaned;
    }
  }

  // Check in notes if technician is mentioned e.g. "Technician: Vikram Patel"
  if (booking.notes && typeof booking.notes === 'string') {
    const techMatch = booking.notes.match(/(?:Technician|Tech|Assigned To|Doctor|Engineer)\s*:\s*([^|;\n,]+)/i);
    if (techMatch && techMatch[1] && techMatch[1].trim()) {
      return techMatch[1].trim();
    }
  }

  // Deterministic fallback based on booking id so each record gets a consistent named technician
  const TECHNICIANS = ['Rajesh Kumar', 'Priya Menon', 'Vikram Patel', 'Suresh Sharma', 'Ananya Roy'];
  const idStr = String(booking.id || booking.created_at || '0');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % TECHNICIANS.length;
  return TECHNICIANS[idx];
}

export function getSlotDatetime(booking: any): string {
  if (!booking) return new Date().toISOString();

  if (typeof booking === 'string') return booking;

  const slot =
    booking.slot_datetime ||
    booking.appointment_datetime ||
    booking.slot ||
    booking.slot_time ||
    booking.appointment_time ||
    booking.created_at;

  if (slot) return slot;

  return new Date().toISOString();
}

export function getServiceType(booking: any): string {
  if (!booking) return 'AC Maintenance & Repair';

  // 1. Check explicit properties on booking object
  const explicit =
    booking.service_type ||
    booking.service ||
    booking.department ||
    booking.service_name ||
    booking.issue_type ||
    booking.hvac_service_type;

  if (explicit && typeof explicit === 'string' && explicit.trim() !== '') {
    return explicit.trim();
  }

  // 2. Extract from notes if present (e.g. "Service: AC Repair" or "Issue: Cooling coil")
  if (booking.notes && typeof booking.notes === 'string') {
    const serviceMatch = booking.notes.match(/(?:Service|Issue|Service Type|Type)\s*:\s*([^|;\n,]+)/i);
    if (serviceMatch && serviceMatch[1] && serviceMatch[1].trim()) {
      return serviceMatch[1].trim();
    }
  }

  // 3. Default fallback
  return 'AC Maintenance & Repair';
}

export function formatIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    // Formats like "26 Jul, 10:30 AM"
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return formatted.replace(/ at /i, ', ').replace(/am/i, 'AM').replace(/pm/i, 'PM');
  } catch (e) {
    return String(dateStr);
  }
}

export function formatISTFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return formatted.replace(/ at /i, ', ').replace(/am/i, 'AM').replace(/pm/i, 'PM');
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Returns the start of today (00:00:00.000) in IST as a Date object.
 */
export function getStartOfTodayIST(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // Output format YYYY-MM-DD

  return new Date(`${parts}T00:00:00+05:30`);
}

/**
 * Checks whether a given timestamp occurred today since midnight IST.
 */
export function isTodayIST(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const startOfTodayIST = getStartOfTodayIST();
    return d.getTime() >= startOfTodayIST.getTime();
  } catch (e) {
    return false;
  }
}

/**
 * Checks whether a timestamp occurred within the last N days in IST.
 */
export function isWithinDaysIST(dateStr: string | null | undefined, days: number): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return d.getTime() >= cutoff.getTime();
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a date string occurred in the last hour
 */
export function isWithinLastHour(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return d.getTime() >= oneHourAgo.getTime();
  } catch (e) {
    return false;
  }
}

export function formatForDateTimeLocalInput(dateStr: string | null | undefined): string {
  if (!dateStr) {
    const now = new Date();
    dateStr = now.toISOString();
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const formatted = formatter.format(d);
    return formatted.replace(',', '').replace(' ', 'T');
  } catch (e) {
    return '';
  }
}

export function dateTimeLocalToISTISO(localValue: string): string {
  if (!localValue) return new Date().toISOString();
  
  const secondsMatch = localValue.match(/T\d{2}:\d{2}:\d{2}$/);
  const timeWithSeconds = secondsMatch ? localValue : `${localValue}:00`;
  
  return `${timeWithSeconds}+05:30`;
}

/**
 * Returns true if the current time/date in IST is on or after the appointment date.
 * Enforces rule: Completed should only be done on or after appointment date only.
 */
export function isAppointmentDateReached(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const now = new Date();

    const getISTDateStr = (dateObj: Date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);
    };

    const todayISTStr = getISTDateStr(now);
    const apptISTStr = getISTDateStr(d);

    return todayISTStr >= apptISTStr || now.getTime() >= d.getTime();
  } catch (e) {
    return true;
  }
}


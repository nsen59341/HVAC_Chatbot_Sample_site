const CITY_KEYWORDS: Record<string, string[]> = {
  'Delhi NCR': ['delhi', 'ncr', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad', 'haryana'],
  'Jaipur': ['jaipur', 'rajasthan', 'pink city', 'mansarovar', 'vaishali'],
  'Mumbai': ['mumbai', 'bombay', 'bandra', 'andheri', 'thane', 'navi mumbai', 'maharashtra'],
  'Bangalore': ['bangalore', 'bengaluru', 'koramangala', 'whitefield', 'indiranagar', 'hsr', 'karnataka'],
  'Pune': ['pune', 'wakad', 'hinjewadi', 'viman nagar', 'kothrud'],
  'Hyderabad': [
    'hyderabad',
    'secunderabad',
    'hitech city',
    'gachibowli',
    'banjara hills',
    'jubilee hills',
    'madhapur',
    'kondapur',
    'kukatpally',
    'abids',
    'lakdikapul',
    'telangana',
    'film nagar',
    'begumpet',
    'ameerpet',
    'charminar',
    'somajiguda',
    'dilsukhnagar',
    'miyapur',
    'manikonda',
    'mehdipatnam',
    'tolichowki',
    'bowenpally',
  ],
};

export const ALL_CITIES = Object.keys(CITY_KEYWORDS);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Extracts all explicit address / location fields from an item.
 */
export function extractAddressText(item: Record<string, any>): string {
  if (!item || typeof item !== 'object') return '';
  const fields = [
    item.service_address,
    item.address,
    item.serviceAddress,
    item.customer_address,
    item.location,
    item.city,
    item.branch,
    item.region,
    item.customers?.service_address,
    item.customers?.address,
  ];
  return fields.filter(Boolean).map(String).join(' ').toLowerCase();
}

/**
 * Extracts secondary contextual fields (notes, transcript messages, technician names, departments).
 */
export function extractContextualText(item: Record<string, any>): string {
  if (!item || typeof item !== 'object') return '';
  const parts: string[] = [];
  if (item.notes) parts.push(String(item.notes));
  if (item.department) parts.push(String(item.department));
  if (item.service_type) parts.push(String(item.service_type));
  if (item.service) parts.push(String(item.service));
  if (item.customer_name) parts.push(String(item.customer_name));
  if (item.patient_name) parts.push(String(item.patient_name));
  if (item.email) parts.push(String(item.email));
  if (item.doctor) parts.push(String(item.doctor));
  if (item.technician) parts.push(String(item.technician));
  if (item.technicians?.name) parts.push(String(item.technicians.name));

  if (Array.isArray(item.transcript)) {
    item.transcript.forEach((m: any) => {
      if (m && m.text) parts.push(String(m.text));
    });
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Detects the city an item belongs to by:
 * 1. Checking address / service_address fields
 * 2. Checking notes / transcript / service type
 * 3. Fallback deterministic hash distribution for unlocated items
 */
export function detectItemCity(item: Record<string, any>): string {
  if (!item || typeof item !== 'object') return 'Hyderabad';

  // 1. Check address / location fields first
  const addrText = extractAddressText(item);
  if (addrText) {
    for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
      if (keywords.some((kw) => addrText.includes(kw))) {
        return city;
      }
    }
  }

  // 2. Check notes and conversation transcript
  const contentText = extractContextualText(item);
  if (contentText) {
    for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
      if (keywords.some((kw) => contentText.includes(kw))) {
        return city;
      }
    }
  }

  // 3. Deterministic hash fallback
  const idStr = String(item.id || item.created_at || item.started_at || JSON.stringify(item));
  const assignedIndex = Math.abs(hashString(idStr)) % ALL_CITIES.length;
  return ALL_CITIES[assignedIndex];
}

export function matchesCity<T extends Record<string, any>>(item: T, targetCity: string): boolean {
  if (!targetCity || targetCity === 'All') return true;
  return detectItemCity(item) === targetCity;
}

export function filterByLocation<T extends Record<string, any>>(items: T[], targetCity: string): T[] {
  if (!targetCity || targetCity === 'All') return items;
  return items.filter((item) => matchesCity(item, targetCity));
}

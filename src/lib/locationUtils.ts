const CITY_KEYWORDS: Record<string, string[]> = {
  'Delhi NCR': ['delhi', 'ncr', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad'],
  'Jaipur': ['jaipur', 'rajasthan', 'pink city', 'mansarovar', 'vaishali'],
  'Mumbai': ['mumbai', 'bombay', 'bandra', 'andheri', 'thane', 'navi mumbai'],
  'Bangalore': ['bangalore', 'bengaluru', 'koramangala', 'whitefield', 'indiranagar', 'hsr'],
  'Pune': ['pune', 'wakad', 'hinjewadi', 'viman nagar', 'kothrud'],
  'Hyderabad': ['hyderabad', 'secunderabad', 'hitech city', 'gachibowli', 'banjara hills'],
};

const ALL_CITIES = Object.keys(CITY_KEYWORDS);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function matchesCity<T extends Record<string, any>>(item: T, targetCity: string): boolean {
  if (!targetCity || targetCity === 'All') return true;

  const targetKeywords = CITY_KEYWORDS[targetCity] || [targetCity.toLowerCase()];

  // Build searchable text representation of the item
  let text = '';
  if (typeof item === 'object' && item !== null) {
    // Check explicit location/city properties first
    const explicitLoc = String(item.city || item.location || item.address || item.branch || item.region || '').toLowerCase();
    if (explicitLoc) {
      if (targetKeywords.some((kw) => explicitLoc.includes(kw))) {
        return true;
      }
    }

    // Stringify relevant text fields
    const parts: string[] = [];
    if (item.notes) parts.push(String(item.notes));
    if (item.department) parts.push(String(item.department));
    if (item.patient_name) parts.push(String(item.patient_name));
    if (item.email) parts.push(String(item.email));
    if (item.source) parts.push(String(item.source));
    if (item.doctor) parts.push(String(item.doctor));
    if (item.customer_id) parts.push(String(item.customer_id));
    if (item.visitor_id) parts.push(String(item.visitor_id));

    if (Array.isArray(item.transcript)) {
      item.transcript.forEach((m: any) => {
        if (m && m.text) parts.push(String(m.text));
      });
    }

    text = parts.join(' ').toLowerCase();
  }

  // 1. Direct keyword match in text
  const matchesTarget = targetKeywords.some((kw) => text.includes(kw));
  if (matchesTarget) return true;

  // 2. Check if text matches another city explicitly
  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    if (city !== targetCity) {
      if (keywords.some((kw) => text.includes(kw))) {
        return false; // Specifically belongs to another city
      }
    }
  }

  // 3. Fallback deterministic distribution for items without city tags
  const idStr = String(item.id || item.created_at || item.started_at || JSON.stringify(item));
  const assignedIndex = Math.abs(hashString(idStr)) % ALL_CITIES.length;
  const assignedCity = ALL_CITIES[assignedIndex];

  return assignedCity === targetCity;
}

export function filterByLocation<T extends Record<string, any>>(items: T[], targetCity: string): T[] {
  if (!targetCity || targetCity === 'All') return items;
  return items.filter((item) => matchesCity(item, targetCity));
}

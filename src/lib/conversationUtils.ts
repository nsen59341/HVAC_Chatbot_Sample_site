import { Conversation, TranscriptMessage } from '../types';

export interface MergedConversation {
  id: string;
  customer_id: string | null;
  visitor_id: string | null;
  started_at: string;
  last_activity_at: string;
  status: string | null;
  transcript: TranscriptMessage[];
  session_ids: string[];
  session_count: number;
}

export const WELCOME_MESSAGES: TranscriptMessage[] = [
  { role: 'assistant', text: 'Hi there! 👋' },
  { role: 'assistant', text: 'My name is Nathan. How can I assist you today?' },
];

export function ensureWelcomeMessages(messages: TranscriptMessage[]): TranscriptMessage[] {
  if (!messages) messages = [];

  const hasWelcome1 = messages.length > 0 && messages[0].text?.trim() === 'Hi there! 👋';
  const hasWelcome2 = messages.length > 1 && (messages[1].text?.includes('Nathan') || messages[1].text?.includes('assist you'));

  if (hasWelcome1 && hasWelcome2) {
    return messages;
  }

  const cleaned = messages.filter((m) => {
    const txt = (m.text || '').trim();
    return txt !== 'Hi there! 👋' && !txt.includes('My name is Nathan');
  });

  return [...WELCOME_MESSAGES, ...cleaned];
}

export function normalizeTranscript(raw: any): TranscriptMessage[] {
  let parsedMsgs: TranscriptMessage[] = [];
  if (raw) {
    if (Array.isArray(raw)) {
      parsedMsgs = raw.map((item) => ({
        role: item.role || item.sender || 'user',
        text: item.text || item.message || item.content || String(item),
      }));
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsedMsgs = normalizeTranscript(parsed);
        }
      } catch (e) {
        parsedMsgs = [{ role: 'assistant', text: raw }];
      }
    }
  }

  return ensureWelcomeMessages(parsedMsgs);
}

export function getValidCustomerId(conv: any): string {
  if (!conv) return 'CUST-1001';
  const custId = conv.customer_id ?? conv.customerId ?? conv.customer_ID ?? conv.phone ?? conv.customer_name ?? conv.visitor_id ?? conv.id;
  if (custId !== null && custId !== undefined) {
    const str = String(custId).trim();
    if (str !== '' && str.toLowerCase() !== 'null' && str.toLowerCase() !== 'undefined') {
      return str;
    }
  }
  return `CUST-${conv.id || Math.floor(Math.random() * 9000 + 1000)}`;
}

/**
 * Groups conversation records based on customer_id.
 * Safe fallback guarantees no conversation is excluded.
 */
export function groupConversations(
  rawConversations: Conversation[],
  _thresholdMinutes = 60
): MergedConversation[] {
  if (!rawConversations || rawConversations.length === 0) return [];

  // Group by customer_id (with safe fallback)
  const customerMap = new Map<string, Conversation[]>();

  rawConversations.forEach((conv) => {
    const custId = getValidCustomerId(conv);
    if (!customerMap.has(custId)) {
      customerMap.set(custId, []);
    }
    customerMap.get(custId)!.push(conv);
  });

  const threads: MergedConversation[] = [];

  customerMap.forEach((convs, customerId) => {
    // Sort chronological ascending
    const sorted = [...convs].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    const firstConv = sorted[0];
    const lastConv = sorted[sorted.length - 1];

    let combinedTranscript: TranscriptMessage[] = [];
    const sessionIds: string[] = [];

    sorted.forEach((conv, index) => {
      sessionIds.push(conv.id);
      const msgs = normalizeTranscript(conv.transcript);

      if (index === 0) {
        combinedTranscript = [...msgs];
      } else {
        // Strip out welcome header duplicates for subsequent sessions
        const nonWelcomeMsgs = msgs.filter((m) => {
          const txt = (m.text || '').trim();
          return txt !== 'Hi there! 👋' && !txt.includes('My name is Nathan');
        });
        combinedTranscript = [...combinedTranscript, ...nonWelcomeMsgs];
      }
    });

    // Deduplicate consecutive identical messages in each merged transcript
    const deduplicated: TranscriptMessage[] = [];
    combinedTranscript.forEach((msg) => {
      if (deduplicated.length === 0) {
        deduplicated.push(msg);
      } else {
        const last = deduplicated[deduplicated.length - 1];
        if (last.role !== msg.role || last.text !== msg.text) {
          deduplicated.push(msg);
        }
      }
    });

    threads.push({
      id: `customer-${customerId}`,
      customer_id: customerId,
      visitor_id: firstConv.visitor_id || null,
      started_at: firstConv.started_at,
      last_activity_at: lastConv.started_at,
      status: lastConv.status || 'Active',
      transcript: deduplicated,
      session_ids: sessionIds,
      session_count: sessionIds.length,
    });
  });

  // Return threads sorted by last_activity_at descending (newest threads first)
  return threads.sort(
    (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );
}

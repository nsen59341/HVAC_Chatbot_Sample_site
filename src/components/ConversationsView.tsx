import React, { useState, useMemo } from 'react';
import { Conversation, TranscriptMessage } from '../types';
import { BRAND } from '../lib/branding';
import {
  groupConversations,
  getValidCustomerId,
  normalizeTranscript,
  MergedConversation,
} from '../lib/conversationUtils';
import { formatISTFull, formatIST } from '../lib/dateUtils';
import { MessageSquare, User, Bot, Clock, Search, Layers, ListFilter, Filter } from 'lucide-react';

interface ConversationsViewProps {
  conversations: Conversation[];
  isLoading: boolean;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations,
  isLoading,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('ALL');
  const [isConsolidated, setIsConsolidated] = useState<boolean>(false);

  // Preserve 100% of conversations with valid fallback customer IDs
  const validConversations = useMemo(() => {
    return conversations.map((c) => ({
      ...c,
      customer_id: getValidCustomerId(c),
    }));
  }, [conversations]);

  // Extract unique customer list for quick filter tabs/pills
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, number>();
    validConversations.forEach((c) => {
      const custId = getValidCustomerId(c);
      map.set(custId, (map.get(custId) || 0) + 1);
    });
    return Array.from(map.entries()).map(([id, count]) => ({ id, count }));
  }, [validConversations]);

  // Grouped consolidated threads vs split raw sessions
  const mergedThreads = useMemo(() => {
    return groupConversations(validConversations);
  }, [validConversations]);

  // Convert raw individual sessions into MergedConversation shape for split rendering
  const rawAsThreads = useMemo(() => {
    return [...validConversations]
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .map((c) => {
        const custId = getValidCustomerId(c);
        return {
          id: c.id,
          customer_id: custId,
          visitor_id: c.visitor_id,
          started_at: c.started_at,
          last_activity_at: c.started_at,
          status: c.status || 'Active',
          transcript: normalizeTranscript(c.transcript),
          session_ids: [c.id],
          session_count: 1,
        };
      });
  }, [validConversations]);

  const activeDisplayList = isConsolidated ? mergedThreads : rawAsThreads;

  // Filter conversations by selected customer pill + search query
  const filteredList = useMemo(() => {
    let list = activeDisplayList;

    if (selectedCustomerFilter !== 'ALL') {
      list = list.filter((item) => item.customer_id === selectedCustomerFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        if (item.id.toLowerCase().includes(q)) return true;
        if (item.customer_id && item.customer_id.toLowerCase().includes(q)) return true;
        if (item.status && item.status.toLowerCase().includes(q)) return true;
        if (item.visitor_id && item.visitor_id.toLowerCase().includes(q)) return true;

        return item.transcript.some((m) => (m.text || '').toLowerCase().includes(q));
      });
    }

    return list;
  }, [activeDisplayList, selectedCustomerFilter, searchQuery]);

  // Currently selected conversation item
  const selectedConversation = useMemo(() => {
    if (!selectedId) return filteredList[0] || activeDisplayList[0] || null;
    return (
      activeDisplayList.find((c) => c.id === selectedId) ||
      filteredList[0] ||
      activeDisplayList[0] ||
      null
    );
  }, [selectedId, filteredList, activeDisplayList]);

  function getFirstUserMessage(transcript: TranscriptMessage[]): string {
    const firstUser = transcript.find(
      (m) =>
        m.role.toLowerCase() === 'user' ||
        m.role.toLowerCase() === 'patient' ||
        m.role.toLowerCase() === 'client'
    );
    if (firstUser && firstUser.text) return firstUser.text;
    if (transcript.length > 0 && transcript[0].text) return transcript[0].text;
    return 'No message content';
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold text-[#1C1917]">Conversations</h2>
              <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] text-[10px] font-mono font-medium border border-[#DCFCE7]">
                Split Per Customer
              </span>
            </div>
            <p className="text-[12px] text-[#78716C]">
              {validConversations.length} total sessions across {uniqueCustomers.length} unique customers
            </p>
          </div>

          {/* View Mode Toggle & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Split Sessions vs Consolidated Toggle */}
            <div className="flex items-center bg-[#FAFAF9] p-0.5 rounded-md border border-[#E7E5E4]">
              <button
                onClick={() => setIsConsolidated(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  !isConsolidated
                    ? 'bg-[#0F172A] text-white shadow-2xs font-semibold'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Split conversations per individual customer session"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Split Sessions</span>
              </button>
              <button
                onClick={() => setIsConsolidated(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  isConsolidated
                    ? 'bg-[#0F172A] text-white shadow-2xs font-semibold'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Consolidate all sessions for a customer into single thread"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Consolidated Threads</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcripts or customer IDs..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-md text-[12px] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
              />
            </div>
          </div>
        </div>

        {/* Customer Filter Pills */}
        {uniqueCustomers.length > 0 && (
          <div className="pt-2 border-t border-[#F5F5F4] flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-[#78716C] font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" />
              Filter Customer:
            </span>
            <button
              onClick={() => setSelectedCustomerFilter('ALL')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                selectedCustomerFilter === 'ALL'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              All Customers ({validConversations.length})
            </button>
            {uniqueCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomerFilter(c.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors shrink-0 ${
                  selectedCustomerFilter === c.id
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {c.id} ({c.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-[12px] text-[#78716C] bg-white rounded-lg border border-[#E7E5E4]">
          Loading conversations from Supabase...
        </div>
      ) : activeDisplayList.length === 0 ? (
        <div className="py-16 text-center text-[12px] text-[#78716C] bg-white rounded-lg border border-[#E7E5E4]">
          No chatbot conversations recorded.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
          {/* Left Panel: Conversation Split Sessions List */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col max-h-[620px]">
            <div className="p-3 bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280] flex items-center justify-between">
              <span>
                {isConsolidated ? 'Consolidated Threads' : 'Split Conversations'} ({filteredList.length})
              </span>
              <span className="text-[10px] text-[#D97706] font-mono lowercase">
                {isConsolidated ? 'Grouped per customer' : 'Split per session'}
              </span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-[#F5F5F4]">
              {filteredList.map((item) => {
                const isSelected = selectedConversation?.id === item.id;
                const firstMsg = getFirstUserMessage(item.transcript);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 cursor-pointer transition-colors text-[12px] ${
                      isSelected ? 'bg-[#FAFAF9] border-l-2 border-l-[#0F172A]' : 'hover:bg-[#FAFAF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[#1C1917] font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-[#78716C]" />
                        <span>{formatIST(item.started_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.session_count > 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-mono font-medium">
                            {item.session_count} turns merged
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-[#F5F5F4] border border-[#E7E5E4] text-[10px] font-mono text-[#78716C]">
                          {item.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[12px] text-[#1C1917] mt-2 line-clamp-2 leading-relaxed font-normal">
                      "{firstMsg}"
                    </p>

                    <div className="mt-2.5 text-[10px] text-[#78716C] font-mono flex items-center justify-between pt-1 border-t border-[#F5F5F4]">
                      <span>{item.transcript.length} messages</span>
                      <span className="truncate max-w-[150px] font-semibold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Customer: {item.customer_id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Chat Transcript Bubbles */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col max-h-[620px]">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-3 bg-[#FAFAF9] border-b border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1C1917]">Transcript Detail</span>
                      {selectedConversation.session_count > 1 && (
                        <span className="px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#15803D] text-[10px] font-mono font-medium">
                          {selectedConversation.session_count} turns consolidated
                        </span>
                      )}
                    </div>
                    <span className="text-[#78716C] font-mono text-[11px] block mt-0.5">
                      Started: {formatISTFull(selectedConversation.started_at)}
                      {selectedConversation.last_activity_at !== selectedConversation.started_at &&
                        ` • Last: ${formatIST(selectedConversation.last_activity_at)}`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#D97706] font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Customer ID: {selectedConversation.customer_id}
                  </span>
                </div>

                {/* Messages Body */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3.5 bg-[#FAFAF9]/50">
                  {selectedConversation.transcript.length === 0 ? (
                    <div className="py-12 text-center text-[#78716C] text-[12px]">
                      No transcript messages stored.
                    </div>
                  ) : (
                    selectedConversation.transcript.map((msg, idx) => {
                      const isUser =
                        msg.role.toLowerCase() === 'user' ||
                        msg.role.toLowerCase() === 'patient' ||
                        msg.role.toLowerCase() === 'visitor' ||
                        msg.role.toLowerCase() === 'client';

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 ${
                            isUser ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Role Icon */}
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isUser ? 'bg-[#0F172A] text-white' : 'bg-[#E7E5E4] text-[#1C1917]'
                            }`}
                          >
                            {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                          </div>

                          {/* Message Box */}
                          <div
                            className={`max-w-[80%] p-3 rounded-lg text-[12px] leading-relaxed border shadow-2xs font-normal ${
                              isUser
                                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                                : 'bg-white text-[#1C1917] border-[#E7E5E4]'
                            }`}
                          >
                            <div className="text-[10px] opacity-75 font-mono mb-0.5">
                              {isUser ? `Customer (${selectedConversation.customer_id})` : `${BRAND.productName} Assistant`}
                            </div>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-[#78716C] text-[12px] my-auto">
                Select a conversation on the left to inspect transcript.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

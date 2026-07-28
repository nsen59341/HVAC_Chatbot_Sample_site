import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Conversation, ActiveTab } from '../types';
import { BRAND } from '../lib/branding';
import { cleanDoctorName, getTechnicianName, getSlotDatetime, formatIST, getServiceType } from '../lib/dateUtils';
import {
  Search,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Download,
  RefreshCw,
  X,
  User,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  conversations: Conversation[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBooking: (booking: Booking) => void;
  onExportCSV: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Bookings' | 'Conversations' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  bookings,
  conversations,
  setActiveTab,
  onSelectBooking,
  onExportCSV,
  onOpenSettings,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global keydown handler for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuery('');
        setSelectedIndex(0);
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Command items builder
  const items = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Go to Dashboard',
        subtitle: 'View overall metrics & recent activity',
        icon: LayoutDashboard,
        action: () => {
          setActiveTab('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-bookings',
        category: 'Navigation',
        title: `Go to ${BRAND.appointmentLabelPlural}`,
        subtitle: `Manage ${BRAND.entityLabel.toLowerCase()} slots, reschedule and notify`,
        icon: Calendar,
        action: () => {
          setActiveTab('bookings');
          onClose();
        },
      },
      {
        id: 'nav-conversations',
        category: 'Navigation',
        title: 'Go to Conversations',
        subtitle: 'View real-time chatbot transcripts',
        icon: MessageSquare,
        action: () => {
          setActiveTab('conversations');
          onClose();
        },
      },
      // Actions
      {
        id: 'act-export',
        category: 'Actions',
        title: `Export Filtered ${BRAND.appointmentLabelPlural} to CSV`,
        subtitle: `Download structured ${BRAND.appointmentLabel.toLowerCase()} records`,
        icon: Download,
        action: () => {
          onExportCSV();
          onClose();
        },
      },
      {
        id: 'act-refresh',
        category: 'Actions',
        title: 'Refresh Supabase Live Data',
        subtitle: 'Sync latest visitors, bookings, and chats',
        icon: RefreshCw,
        action: () => {
          onRefresh();
          onClose();
        },
      },
      {
        id: 'act-settings',
        category: 'Actions',
        title: 'Webhook & Integration Settings',
        subtitle: 'Configure n8n endpoint URLs',
        icon: Settings,
        action: () => {
          onOpenSettings();
          onClose();
        },
      },
    ];

    // Search matching bookings
    const q = query.toLowerCase().trim();
    if (q) {
      bookings.forEach((b) => {
        const name = (b.patient_name || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const doctor = getTechnicianName(b).toLowerCase();
        const dept = getServiceType(b).toLowerCase();

        if (name.includes(q) || phone.includes(q) || doctor.includes(q) || dept.includes(q)) {
          list.push({
            id: `booking-${b.id}`,
            category: 'Bookings',
            title: b.patient_name || BRAND.entityLabel,
            subtitle: `${getServiceType(b)} • ${getTechnicianName(b)} • Slot: ${formatIST(getSlotDatetime(b))}`,
            icon: User,
            action: () => {
              setActiveTab('bookings');
              onSelectBooking(b);
              onClose();
            },
          });
        }
      });
    }

    // Filter items by query
    if (!q) return list;

    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, bookings, conversations, setActiveTab, onSelectBooking, onExportCSV, onOpenSettings, onRefresh, onClose]);

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside Palette modal
  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" />

      {/* Command Palette Card */}
      <div
        onKeyDown={handleKeyDownModal}
        className="relative w-full max-w-xl bg-white rounded-xl border border-[#E7E5E4] shadow-2xl z-10 overflow-hidden text-[#1C1917]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E7E5E4] bg-[#FAFAF9]">
          <Search className="w-4 h-4 text-[#78716C] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Type a command or search ${BRAND.entityLabel.toLowerCase()}, ${BRAND.ownerLabel.toLowerCase()}, phone...`}
            className="w-full bg-transparent text-[13px] font-normal text-[#1C1917] placeholder-[#A8A29E] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#78716C] bg-white border border-[#E7E5E4] rounded shadow-xs ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto py-2 divide-y divide-[#F5F5F4]">
          {items.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[#78716C]">
              No commands or {BRAND.appointmentLabelPlural.toLowerCase()} found matching "{query}"
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-[13px] transition-colors ${
                    isSelected ? 'bg-[#F5F5F4]' : 'hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded border text-[#1C1917] ${
                        isSelected ? 'bg-white border-[#D6D3D1]' : 'bg-[#FAFAF9] border-[#E7E5E4]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-[#1C1917] flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono text-[#A8A29E] uppercase">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-[#78716C] truncate mt-0.5 font-normal">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#0F172A] shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-[#FAFAF9] border-t border-[#E7E5E4] text-[11px] text-[#78716C] flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Cmd+K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};

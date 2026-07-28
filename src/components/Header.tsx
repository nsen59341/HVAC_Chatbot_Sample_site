import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from '../lib/branding';
import { NotificationDropdown } from './NotificationDropdown';
import { Booking } from '../types';
import { Clock, Search, ChevronDown, User, Check, Building2 } from 'lucide-react';

interface HeaderProps {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLocation,
  onSelectLocation,
  bookings,
  onSelectBooking,
  onOpenCommandPalette,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isAvatarOpen, setIsAvatarOpen] = useState<boolean>(false);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setTimeStr(formatted.replace(/ at /i, ', ').replace(/am/i, 'AM').replace(/pm/i, 'PM'));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-[#E7E5E4] sticky top-0 z-20 px-6 flex items-center justify-between text-[#1C1917]">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight text-[#1C1917] leading-none">
              FrontDesk
            </h1>
            <span className="text-[11px] text-[#78716C] font-normal">
              for {BRAND_CONFIG.orgName}
            </span>
          </div>
        </div>

        {/* Location Chip Filter - Desktop & Tablet */}
        <div className="hidden md:flex items-center gap-1 pl-4 border-l border-[#E7E5E4] overflow-x-auto">
          {BRAND_CONFIG.locations.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onSelectLocation(loc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#D97706] text-white shadow-2xs font-semibold'
                    : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4]'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Location Dropdown - Mobile */}
        <div className="md:hidden flex items-center pl-2 border-l border-[#E7E5E4]">
          <select
            value={selectedLocation}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="px-2 py-1 rounded-md bg-[#FAFAF9] border border-[#E7E5E4] text-[11px] text-[#1C1917] font-medium focus:outline-none focus:ring-1 focus:ring-[#D97706]"
          >
            {BRAND_CONFIG.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Tools Bar */}
      <div className="flex items-center gap-3">
        {/* Cmd+K Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FAFAF9] border border-[#E7E5E4] hover:bg-[#F5F5F4] text-[12px] text-[#78716C] transition-colors"
          title="Search or commands (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#78716C]" />
          <span>Search...</span>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono text-[#78716C] bg-white border border-[#E7E5E4] rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF9] border border-[#E7E5E4] text-[11px] font-mono text-[#1C1917]">
          <Clock className="w-3.5 h-3.5 text-[#0F172A]" />
          <span>IST: {timeStr || 'Loading...'}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <NotificationDropdown bookings={bookings} onSelectBooking={onSelectBooking} />

        {/* Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setIsAvatarOpen(!isAvatarOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-[#F5F5F4] border border-transparent hover:border-[#E7E5E4] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[#0F172A] text-white text-[11px] font-bold flex items-center justify-center font-mono">
              FD
            </div>
            <div className="hidden sm:block text-[12px] leading-tight">
              <div className="font-semibold text-[#1C1917]">Front Desk Admin</div>
              <div className="text-[10px] text-[#78716C] font-normal">{BRAND_CONFIG.orgName}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
          </button>

          {/* Avatar Dropdown Menu */}
          {isAvatarOpen && (
            <>
              <div onClick={() => setIsAvatarOpen(false)} className="fixed inset-0 z-30" />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg border border-[#E7E5E4] shadow-lg z-40 text-[12px] text-[#1C1917] py-1">
                <div className="px-3 py-2 border-b border-[#F5F5F4]">
                  <p className="font-semibold">Front Desk Operations</p>
                  <p className="text-[10px] text-[#78716C]">admin@kinghvac.com</p>
                  <p className="text-[10px] text-[#D97706] font-mono mt-0.5">{BRAND_CONFIG.phone}</p>
                </div>
                <div className="px-3 py-2 text-[11px] text-[#78716C]">
                  Role: HVAC Dispatch Manager
                </div>
                <div className="border-t border-[#F5F5F4] pt-1">
                  <a
                    href={BRAND_CONFIG.chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[12px] text-[#D97706] font-medium"
                  >
                    <span>Customer AI Chatbot</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                  <button
                    onClick={() => {
                      setIsAvatarOpen(false);
                      onOpenCommandPalette();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[12px]"
                  >
                    Command Palette (Cmd+K)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

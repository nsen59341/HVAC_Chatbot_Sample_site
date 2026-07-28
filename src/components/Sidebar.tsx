import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { BRAND_CONFIG } from '../lib/branding';
import {
  LayoutDashboard,
  CalendarCheck2,
  MessageSquare,
  Settings,
  RefreshCw,
  Fan,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openWebhookSettings: () => void;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  lastUpdatedText: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openWebhookSettings,
  isRefreshing,
  onManualRefresh,
  lastUpdatedText,
}) => {
  const [logoError, setLogoError] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck2 },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col z-30 text-slate-100 font-sans shadow-none">
      {/* Top Sidebar Logo Card */}
      <div className="p-4 border-b border-slate-800">
        <div className="bg-white rounded-lg p-2.5 flex items-center justify-between border border-slate-700/50 shadow-xs relative overflow-hidden group">
          {/* Accent Line on Left of Card */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D97706]" />

          <div className="flex items-center gap-2.5 pl-1.5 min-w-0">
            {Boolean(BRAND_CONFIG.logoUrl) && !logoError ? (
              <img
                src={BRAND_CONFIG.logoUrl}
                alt={BRAND_CONFIG.orgName}
                onError={() => setLogoError(true)}
                className="h-7 max-w-[130px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900 tracking-tight font-mono">
                <Fan className="w-4 h-4 text-[#D97706] animate-spin-slow" />
                <span>{BRAND_CONFIG.fallbackLogoText}</span>
              </div>
            )}
          </div>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
            ADMIN
          </span>
        </div>

        {/* Front Desk Phone Widget */}
        <div className="mt-2.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <PhoneCall className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{BRAND_CONFIG.phone}</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800 px-1 rounded">
            Front Desk
          </span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="px-3 py-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-normal transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
            </button>
          );
        })}

        {/* Live N8N Chatbot External Link */}
        <div className="pt-3 border-t border-slate-800/60 mt-3">
          <a
            href={BRAND_CONFIG.chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-amber-300 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 transition-colors font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="flex-1 truncate">Customer AI Chatbot</span>
            <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
          </a>
        </div>
      </div>

      {/* Live Sync Status Widget */}
      <div className="p-3 mx-3 mb-2 rounded-md bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-400">Live Sync</span>
          </div>
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Refresh live Supabase data"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-1">
          Updated: {lastUpdatedText || 'Just now'} (10s auto)
        </div>
      </div>

      {/* Settings Action */}
      <div className="px-3 pb-2">
        <button
          onClick={openWebhookSettings}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-[12px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Webhook Endpoints</span>
        </button>
      </div>

      {/* Small Permanent Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 leading-normal font-normal">
        Admin Portal for <span className="text-slate-300 font-medium">{BRAND_CONFIG.orgName}</span>. Manage HVAC customer bookings, conversations & dispatch.
      </div>
    </aside>
  );
};

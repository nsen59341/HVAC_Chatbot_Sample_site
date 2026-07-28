import React, { useState } from 'react';
import { getWebhookConfig, setWebhookConfig } from '../lib/webhook';
import { BRAND } from '../lib/branding';
import { X, Save, Settings, Link, RefreshCw } from 'lucide-react';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({ isOpen, onClose, addToast }) => {
  const current = getWebhookConfig();
  const [rescheduleUrl, setRescheduleUrl] = useState(current.rescheduleUrl);
  const [notifyUrl, setNotifyUrl] = useState(current.notifyUrl);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookConfig({ rescheduleUrl, notifyUrl });
    addToast('success', 'Webhook configurations saved successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#E7E5E4] shadow-2xl z-10 overflow-hidden text-[#1C1917]">
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[14px]">
            <Settings className="w-4 h-4 text-[#0F172A]" />
            <span>n8n Webhook Configuration</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#78716C] hover:text-[#1C1917]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4 text-[13px]">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280] mb-1">
              Reschedule Webhook Endpoint
            </label>
            <input
              type="url"
              value={rescheduleUrl}
              onChange={(e) => setRescheduleUrl(e.target.value)}
              placeholder="https://n8n.instance/webhook/reschedule..."
              className="w-full px-3 py-1.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-md text-[12px] font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280] mb-1">
              Notify {BRAND.entityLabel} Webhook Endpoint
            </label>
            <input
              type="url"
              value={notifyUrl}
              onChange={(e) => setNotifyUrl(e.target.value)}
              placeholder="https://n8n.instance/webhook/notify..."
              className="w-full px-3 py-1.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-md text-[12px] font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
              required
            />
          </div>

          <div className="p-3 bg-[#F5F5F4] rounded-md text-[11px] text-[#78716C] leading-relaxed">
            These endpoints are triggered when you reschedule a {BRAND.appointmentLabel.toLowerCase()} or send a {BRAND.entityLabel.toLowerCase()} notification from {BRAND.productName} AI.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#E7E5E4] text-[12px] text-[#78716C] hover:bg-[#FAFAF9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[#0F172A] text-white text-[12px] font-medium hover:bg-slate-800 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

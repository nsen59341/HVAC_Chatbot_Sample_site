import React, { useState } from 'react';
import {
  getRescheduleWebhookUrl,
  getNotifyWebhookUrl,
  saveWebhookUrls,
  DEFAULT_RESCHEDULE_WEBHOOK_URL,
  DEFAULT_NOTIFY_WEBHOOK_URL,
} from '../lib/webhookConfig';
import { Settings, X, Save, RotateCcw, Link2, CheckCircle2 } from 'lucide-react';

interface WebhookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [rescheduleUrl, setRescheduleUrl] = useState<string>(getRescheduleWebhookUrl());
  const [notifyUrl, setNotifyUrl] = useState<string>(getNotifyWebhookUrl());

  if (!isOpen) return null;

  const handleSave = () => {
    if (!rescheduleUrl.trim() || !notifyUrl.trim()) {
      showToast('error', 'Webhook URLs cannot be empty.');
      return;
    }

    saveWebhookUrls(rescheduleUrl.trim(), notifyUrl.trim());
    showToast('success', 'Webhook configurations saved successfully');
    onClose();
  };

  const handleReset = () => {
    setRescheduleUrl(DEFAULT_RESCHEDULE_WEBHOOK_URL);
    setNotifyUrl(DEFAULT_NOTIFY_WEBHOOK_URL);
    saveWebhookUrls(DEFAULT_RESCHEDULE_WEBHOOK_URL, DEFAULT_NOTIFY_WEBHOOK_URL);
    showToast('success', 'Webhook URLs reset to default n8n endpoints');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-10 text-slate-100 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Webhook Configuration</h3>
              <p className="text-xs text-slate-400">Configure n8n or custom webhook HTTP endpoints</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Reschedule Webhook URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Reschedule Webhook Endpoint</span>
            </label>
            <input
              type="text"
              value={rescheduleUrl}
              onChange={(e) => setRescheduleUrl(e.target.value)}
              placeholder="https://your-n8n-instance.cloud/webhook/reschedule"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400">
              Target for POST JSON containing <code className="text-amber-300">booking_id</code> and{' '}
              <code className="text-amber-300">new_slot_datetime</code> (+05:30).
            </p>
          </div>

          {/* Notify Webhook URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Send Email / Notify Webhook Endpoint</span>
            </label>
            <input
              type="text"
              value={notifyUrl}
              onChange={(e) => setNotifyUrl(e.target.value)}
              placeholder="https://your-n8n-instance.cloud/webhook/notify"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400">
              Target for POST JSON containing <code className="text-indigo-300">booking_id</code>,{' '}
              <code className="text-indigo-300">channel</code>, and <code className="text-indigo-300">message</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

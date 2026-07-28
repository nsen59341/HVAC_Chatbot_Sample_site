export const DEFAULT_RESCHEDULE_WEBHOOK_URL =
  'https://nsenchatbot456.app.n8n.cloud/webhook/reschedule';

export const DEFAULT_NOTIFY_WEBHOOK_URL =
  'https://nsenchatbot456.app.n8n.cloud/webhook/notify';

export function getRescheduleWebhookUrl(): string {
  return localStorage.getItem('frontdesk_reschedule_webhook') || DEFAULT_RESCHEDULE_WEBHOOK_URL;
}

export function getNotifyWebhookUrl(): string {
  return localStorage.getItem('frontdesk_notify_webhook') || DEFAULT_NOTIFY_WEBHOOK_URL;
}

export function saveWebhookUrls(rescheduleUrl: string, notifyUrl: string): void {
  localStorage.setItem('frontdesk_reschedule_webhook', rescheduleUrl);
  localStorage.setItem('frontdesk_notify_webhook', notifyUrl);
}

import {
  DEFAULT_RESCHEDULE_WEBHOOK_URL,
  DEFAULT_NOTIFY_WEBHOOK_URL,
  getRescheduleWebhookUrl,
  getNotifyWebhookUrl,
  saveWebhookUrls,
} from './webhookConfig';

export interface WebhookConfig {
  rescheduleUrl: string;
  notifyUrl: string;
}

export function getWebhookConfig(): WebhookConfig {
  return {
    rescheduleUrl: getRescheduleWebhookUrl(),
    notifyUrl: getNotifyWebhookUrl(),
  };
}

export function setWebhookConfig(config: WebhookConfig): void {
  saveWebhookUrls(config.rescheduleUrl, config.notifyUrl);
}

export async function triggerRescheduleWebhook(payload: any): Promise<boolean> {
  const url = getRescheduleWebhookUrl();
  if (!url || !url.trim()) return false;

  const bodyData = JSON.stringify({
    event: 'booking.rescheduled',
    timestamp: new Date().toISOString(),
    ...payload,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyData,
    });
    return res.ok;
  } catch (err) {
    // Retry with no-cors in case target endpoint lacks CORS headers
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: bodyData,
      });
      return true;
    } catch (fallbackErr) {
      console.warn('Reschedule webhook notification failed gracefully');
      return false;
    }
  }
}

export async function triggerNotifyWebhook(payload: any): Promise<boolean> {
  const url = getNotifyWebhookUrl();
  if (!url || !url.trim()) return false;

  const bodyData = JSON.stringify({
    event: 'patient.notification',
    timestamp: new Date().toISOString(),
    ...payload,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyData,
    });
    return res.ok;
  } catch (err) {
    // Retry with no-cors in case target endpoint lacks CORS headers
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: bodyData,
      });
      return true;
    } catch (fallbackErr) {
      console.warn('Notify webhook notification failed gracefully');
      return false;
    }
  }
}

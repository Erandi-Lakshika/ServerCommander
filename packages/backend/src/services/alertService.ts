import { Resend } from 'resend';
import { AlertConfig, AlertEvent, ServerMetrics } from '@dashboard/shared';
import { CONFIG } from '../config';

export class AlertService {
  private static instance: AlertService;
  private config: AlertConfig = {
    emailRecipient: CONFIG.ALERT_EMAIL_RECIPIENT,
    cpuThreshold: CONFIG.ALERT_CPU_THRESHOLD,
    memThreshold: CONFIG.ALERT_MEM_THRESHOLD,
    diskThreshold: CONFIG.ALERT_DISK_THRESHOLD,
    enabled: true,
    resendApiKey: CONFIG.RESEND_API_KEY,
  };

  private alertEvents: AlertEvent[] = [];
  private lastAlertTimes: Record<string, number> = {};
  private alertCooldownMs = 15 * 60 * 1000; // 15 mins cooldown between repeated emails

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  public getConfig(): AlertConfig {
    return { ...this.config, resendApiKey: this.config.resendApiKey ? '***configured***' : '' };
  }

  public updateConfig(newConfig: Partial<AlertConfig>): AlertConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      resendApiKey: newConfig.resendApiKey || this.config.resendApiKey,
    };
    return this.getConfig();
  }

  public getEvents(limit = 50): AlertEvent[] {
    return this.alertEvents.slice(0, limit);
  }

  public async evaluateMetrics(metrics: ServerMetrics): Promise<void> {
    if (!this.config.enabled) return;

    const now = Date.now();

    // 1. CPU Check
    if (metrics.cpu.usagePercent >= this.config.cpuThreshold) {
      await this.triggerAlert({
        type: 'CPU',
        severity: 'CRITICAL',
        title: `High CPU Alert: ${metrics.cpu.usagePercent}%`,
        message: `Server ${metrics.system.hostname} CPU load reached ${metrics.cpu.usagePercent}% (Threshold: ${this.config.cpuThreshold}%).`,
      });
    }

    // 2. Memory Check
    if (metrics.memory.percentUsed >= this.config.memThreshold) {
      await this.triggerAlert({
        type: 'MEMORY',
        severity: 'CRITICAL',
        title: `High RAM Usage Alert: ${metrics.memory.percentUsed}%`,
        message: `Server ${metrics.system.hostname} Memory usage is at ${metrics.memory.percentUsed}% (Threshold: ${this.config.memThreshold}%).`,
      });
    }

    // 3. Disk Check
    for (const disk of metrics.disks) {
      if (disk.usePercent >= this.config.diskThreshold) {
        await this.triggerAlert({
          type: 'DISK',
          severity: 'WARNING',
          title: `Disk Space Warning: ${disk.mount} at ${disk.usePercent}%`,
          message: `Storage partition ${disk.mount} on ${metrics.system.hostname} is ${disk.usePercent}% full (Threshold: ${this.config.diskThreshold}%).`,
        });
      }
    }
  }

  public async triggerAlert(eventInput: Omit<AlertEvent, 'id' | 'timestamp' | 'resolved'>): Promise<{ sent: boolean; message: string }> {
    const eventKey = `${eventInput.type}_${eventInput.severity}`;
    const now = Date.now();
    const lastSent = this.lastAlertTimes[eventKey] || 0;

    const event: AlertEvent = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      resolved: false,
      ...eventInput,
    };

    this.alertEvents.unshift(event);
    if (this.alertEvents.length > 100) this.alertEvents.pop();

    // Check cooldown
    if (now - lastSent < this.alertCooldownMs) {
      return { sent: false, message: 'Alert recorded in history; email suppressed due to 15m cooldown.' };
    }

    const apiKey = this.config.resendApiKey || CONFIG.RESEND_API_KEY;
    if (!apiKey) {
      return { sent: false, message: 'Alert logged. Resend API key not configured yet.' };
    }

    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: 'Server Alerts <onboarding@resend.dev>',
        to: [this.config.emailRecipient],
        subject: `[${event.severity}] ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: ${event.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'};">${event.title}</h2>
            <p style="font-size: 16px;">${event.message}</p>
            <hr style="border-color: #334155;" />
            <p style="font-size: 12px; color: #94a3b8;">
              Alert dispatched from Server Dashboard (dashboard.ictevents.space)<br/>
              Timestamp: ${new Date(event.timestamp).toUTCString()}
            </p>
          </div>
        `,
      });

      if (error) {
        return { sent: false, message: `Resend error: ${error.message}` };
      }

      this.lastAlertTimes[eventKey] = now;
      return { sent: true, message: `Alert email dispatched to ${this.config.emailRecipient}` };
    } catch (err: any) {
      return { sent: false, message: err.message || 'Failed to dispatch alert email' };
    }
  }
}

export const alertService = AlertService.getInstance();

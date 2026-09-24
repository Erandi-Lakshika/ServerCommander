import React, { useState, useEffect } from 'react';
import { Mail, Send, Bell, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { AlertConfig, AlertEvent } from '@dashboard/shared';

interface AlertsManagerProps {
  token: string | null;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({ token }) => {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [resendApiKey, setResendApiKey] = useState('');
  const [recipient, setRecipient] = useState('');
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [memThreshold, setMemThreshold] = useState(90);
  const [diskThreshold, setDiskThreshold] = useState(85);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; isError: boolean } | null>(null);

  const fetchAlertData = async () => {
    if (!token) return;
    try {
      const [resConf, resEvents] = await Promise.all([
        fetch('/api/alerts/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/alerts/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resConf.ok) {
        const confData: AlertConfig = await resConf.json();
        setConfig(confData);
        setRecipient(confData.emailRecipient || 'itkindom.dhomes@gmail.com');
        setCpuThreshold(confData.cpuThreshold || 90);
        setMemThreshold(confData.memThreshold || 90);
        setDiskThreshold(confData.diskThreshold || 85);
      }

      if (resEvents.ok) {
        const eventData = await resEvents.json();
        setEvents(eventData);
      }
    } catch (e) {
      console.error('Error fetching alerts config:', e);
    }
  };

  useEffect(() => {
    fetchAlertData();
  }, [token]);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setNotification(null);

    try {
      const body: any = {
        emailRecipient: recipient,
        cpuThreshold,
        memThreshold,
        diskThreshold,
        enabled: true,
      };
      if (resendApiKey) {
        body.resendApiKey = resendApiKey;
      }

      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setNotification({ msg: 'Alert settings updated successfully!', isError: false });
        setResendApiKey('');
        fetchAlertData();
      } else {
        setNotification({ msg: 'Failed to update alert settings', isError: true });
      }
    } catch (err: any) {
      setNotification({ msg: err.message || 'Network error', isError: true });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const triggerTestAlert = async () => {
    if (!token) return;
    setTesting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Test email dispatched to verify Resend delivery to ${recipient}. Server is nominal!`,
        }),
      });

      const data = await res.json();
      setNotification({
        msg: data.message || 'Test dispatch attempted.',
        isError: !data.sent,
      });
      fetchAlertData();
    } catch (err: any) {
      setNotification({ msg: err.message || 'Failed to dispatch test alert', isError: true });
    } finally {
      setTesting(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Alert Configuration Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Resend Email Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Automated email alerts dispatched when thresholds are breached
              </p>
            </div>
          </div>

          <button
            onClick={triggerTestAlert}
            disabled={testing}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-purple-500/40 text-xs font-mono text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <Send className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Send Test Email</span>
          </button>
        </div>

        {notification && (
          <div
            className={`mb-6 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2 border ${
              notification.isError
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {notification.isError ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span>{notification.msg}</span>
          </div>
        )}

        <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              Resend API Key ({config?.resendApiKey ? 'Configured ✅' : 'Not Set ⚠️'})
            </label>
            <input
              type="password"
              placeholder="re_xxxxxxxxxxxxxx"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              <span>CPU Alert Threshold</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cpuThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              <span>RAM Alert Threshold</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">{memThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={memThreshold}
              onChange={(e) => setMemThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
            >
              {saving ? 'Saving...' : 'Save Alert Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Alert Events History */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Incident & Alert History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Recent triggered alerts and email dispatches</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No alert events logged yet. All systems operating normally.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{ev.type}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 dark:text-white font-semibold">{ev.title}</td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-md">{ev.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

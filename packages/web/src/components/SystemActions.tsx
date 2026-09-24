import React, { useState } from 'react';
import {
  Zap,
  RefreshCcw,
  Trash2,
  Power,
  Layers,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Send,
  RotateCcw,
} from 'lucide-react';

interface SystemActionsProps {
  token: string | null;
}

export const SystemActions: React.FC<SystemActionsProps> = ({ token }) => {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    'System Operations Console ready.\nSelect an action above or dispatch a custom administrative command.\n'
  );
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [customCmd, setCustomCmd] = useState('');
  const [copied, setCopied] = useState(false);

  const runAction = async (action: string, customCommand?: string) => {
    if (!token || executingAction) return;

    setExecutingAction(action);
    setConsoleStatus('executing');
    const timestamp = new Date().toLocaleTimeString();
    const actionLabel = customCommand ? `Custom: "${customCommand}"` : action;

    setConsoleOutput((prev) => `${prev}\n[${timestamp}] ⚙ Executing ${actionLabel}...\n`);

    try {
      const res = await fetch('/api/system/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, customCommand }),
      });

      const data = await res.json();
      const endTimestamp = new Date().toLocaleTimeString();

      if (res.ok && data.success) {
        setConsoleStatus('success');
        setConsoleOutput(
          (prev) => `${prev}[${endTimestamp}] ✔ [SUCCESS]\n${data.output || 'Action executed successfully.'}\n`
        );
      } else {
        setConsoleStatus('error');
        setConsoleOutput(
          (prev) => `${prev}[${endTimestamp}] ✖ [FAILED]\n${data.output || data.error || 'Execution failed.'}\n`
        );
      }
    } catch (err: any) {
      const endTimestamp = new Date().toLocaleTimeString();
      setConsoleStatus('error');
      setConsoleOutput((prev) => `${prev}[${endTimestamp}] ✖ [NETWORK ERROR]\n${err.message || 'Request failed'}\n`);
    } finally {
      setExecutingAction(null);
      setShowRebootModal(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    runAction('custom', customCmd.trim());
    setCustomCmd('');
  };

  const copyConsole = () => {
    navigator.clipboard.writeText(consoleOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearConsole = () => {
    setConsoleOutput('Console output cleared.\n');
    setConsoleStatus('idle');
  };

  const actionCards = [
    {
      id: 'clear_cache',
      title: 'Drop PageCache & Free RAM',
      desc: 'Flushes cached memory, dentries, and inodes (sync && echo 3 > drop_caches) to free unallocated RAM.',
      command: 'sync && echo 3 > /proc/sys/vm/drop_caches',
      icon: Trash2,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      btnText: 'Drop Cache',
      danger: false,
    },
    {
      id: 'restart_caddy',
      title: 'Reload Caddy Reverse Proxy',
      desc: 'Gracefully reloads Caddy configuration and SSL certificates without dropping active connections.',
      command: 'systemctl reload caddy',
      icon: RefreshCcw,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      btnText: 'Reload Caddy',
      danger: false,
    },
    {
      id: 'restart_pm2',
      title: 'Restart PM2 Backend Cluster',
      desc: 'Performs zero-downtime cluster reload of the Node.js API backend service processes.',
      command: 'pm2 reload all',
      icon: Layers,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      btnText: 'Restart PM2',
      danger: false,
    },
    {
      id: 'reboot',
      title: 'Reboot Host Server',
      desc: 'Initiates a full Linux kernel restart with a 1-minute shutdown grace period.',
      command: 'shutdown -r +1 "Reboot triggered via Dashboard"',
      icon: Power,
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      btnText: 'Reboot Server',
      danger: true,
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
              Host System Operations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Emergency administrative controls and live stdout execution logging
            </p>
          </div>
        </div>
      </div>

      {/* 4 Emergency Operations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionCards.map((act) => {
          const Icon = act.icon;
          const isCurrentLoading = executingAction === act.id;

          return (
            <div
              key={act.id}
              className={`glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                act.danger
                  ? 'border-red-500/30 hover:border-red-500/50 bg-red-500/[0.02]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl border ${act.color}`}>
                      <Icon className={`h-5 w-5 ${isCurrentLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</h3>
                      {act.danger && (
                        <span className="text-[10px] uppercase font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          Danger Zone
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-mono leading-relaxed">
                  {act.desc}
                </p>

                <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 truncate">
                  $ {act.command}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                {act.danger ? (
                  <button
                    onClick={() => setShowRebootModal(true)}
                    disabled={!!executingAction}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors shadow-md shadow-red-600/20"
                  >
                    {isCurrentLoading ? 'Dispatching...' : act.btnText}
                  </button>
                ) : (
                  <button
                    onClick={() => runAction(act.id)}
                    disabled={!!executingAction}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
                  >
                    {isCurrentLoading && <RefreshCcw className="h-3.5 w-3.5 animate-spin mr-1" />}
                    <span>{isCurrentLoading ? 'Executing...' : act.btnText}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Custom Command Runner */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <Terminal className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
            Quick Diagnostic Dispatcher
          </h3>
        </div>
        <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 font-mono text-xs">
              $
            </span>
            <input
              type="text"
              placeholder="e.g. pm2 list, systemctl status caddy, uptime, ufw status..."
              value={customCmd}
              onChange={(e) => setCustomCmd(e.target.value)}
              disabled={!!executingAction}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-7 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!customCmd.trim() || !!executingAction}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/20"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Run</span>
          </button>
        </form>
      </div>

      {/* Live Action Output Console matching mobile tvActionOutput */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                consoleStatus === 'executing'
                  ? 'bg-amber-500 animate-ping'
                  : consoleStatus === 'success'
                  ? 'bg-emerald-500'
                  : consoleStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}
            />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
              Action Output Console
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                consoleStatus === 'executing'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : consoleStatus === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : consoleStatus === 'error'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}
            >
              {consoleStatus}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyConsole}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Copy Console Output"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={clearConsole}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Clear Console"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <pre className="w-full h-56 bg-[#090d16] text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-emerald-500 selection:text-black">
          {consoleOutput}
        </pre>
      </div>

      {/* Danger Modal: Reboot Server Confirmation */}
      {showRebootModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border-red-500/40 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Danger: Reboot Host Server</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed mb-6">
              This will dispatch a graceful reboot command to <span className="font-bold text-white">168.144.134.223</span>.
              All active sessions, services, and web reverse proxies will temporarily go offline for 1–2 minutes.
              Are you sure you wish to proceed?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRebootModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => runAction('reboot')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/25"
              >
                Reboot Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

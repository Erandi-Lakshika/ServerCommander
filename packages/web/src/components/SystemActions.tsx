import React, { useState, useEffect } from 'react';
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
  Sliders,
  Play,
  Square,
  X,
  Activity,
  Clock,
} from 'lucide-react';
import { Pm2ProcessItem } from '@dashboard/shared';

interface SystemActionsProps {
  token: string | null;
}

export const SystemActions: React.FC<SystemActionsProps> = ({ token }) => {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    'System Operations Console ready.\nSelect an action above, choose a PM2 process, or dispatch custom commands.\n'
  );
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [showPm2Modal, setShowPm2Modal] = useState(false);
  const [pm2List, setPm2List] = useState<Pm2ProcessItem[]>([]);
  const [selectedPm2Target, setSelectedPm2Target] = useState<string>('all');
  const [loadingPm2, setLoadingPm2] = useState<boolean>(false);
  const [customCmd, setCustomCmd] = useState('');
  const [copied, setCopied] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatUptime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const fetchPm2List = async () => {
    if (!token) return;
    setLoadingPm2(true);
    try {
      const res = await fetch('/api/system/pm2', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPm2List(data);
      }
    } catch (e) {
      console.error('Failed to fetch PM2 processes', e);
    } finally {
      setLoadingPm2(false);
    }
  };

  useEffect(() => {
    fetchPm2List();
    const interval = setInterval(fetchPm2List, 6000);
    return () => clearInterval(interval);
  }, [token]);

  const runAction = async (action: string, customCommand?: string, target?: string) => {
    if (!token || executingAction) return;

    setExecutingAction(action);
    setConsoleStatus('executing');
    const timestamp = new Date().toLocaleTimeString();

    let actionLabel = action;
    if (customCommand) {
      actionLabel = `Custom: "${customCommand}"`;
    } else if (target) {
      actionLabel = `${action} [Target: ${target}]`;
    }

    setConsoleOutput((prev) => `${prev}\n[${timestamp}] ⚙ Executing ${actionLabel}...\n`);

    try {
      const res = await fetch('/api/system/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, customCommand, target }),
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
      setShowPm2Modal(false);
      fetchPm2List();
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

  return (
    <div className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Host System Operations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Individual PM2 process management, emergency recovery controls, and real-time execution logs
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPm2Modal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-amber-500/40 text-xs font-mono text-amber-600 dark:text-amber-400 transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Manage PM2 ({pm2List.length} active)</span>
          </button>
        </div>
      </div>

      {/* 4 Operations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Drop PageCache */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <Trash2 className={`h-5 w-5 ${executingAction === 'clear_cache' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Drop PageCache & Free RAM</h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Linux Memory Recovery</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-mono leading-relaxed">
              Flushes cached memory, dentries, and inodes (sync && echo 3 &gt; drop_caches) to free unallocated RAM.
            </p>
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 truncate">
              $ sync && echo 3 &gt; /proc/sys/vm/drop_caches
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <button
              onClick={() => runAction('clear_cache')}
              disabled={!!executingAction}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
            >
              {executingAction === 'clear_cache' && <RefreshCcw className="h-3.5 w-3.5 animate-spin mr-1" />}
              <span>Drop Cache</span>
            </button>
          </div>
        </div>

        {/* Card 2: Reload Caddy */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl border text-sky-500 bg-sky-500/10 border-sky-500/20">
                <RefreshCcw className={`h-5 w-5 ${executingAction === 'restart_caddy' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reload Caddy Reverse Proxy</h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Zero-Downtime SSL & Routing</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-mono leading-relaxed">
              Gracefully reloads Caddy configuration and SSL certificates without dropping active connections.
            </p>
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 truncate">
              $ systemctl reload caddy
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <button
              onClick={() => runAction('restart_caddy')}
              disabled={!!executingAction}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20 flex items-center space-x-1.5"
            >
              {executingAction === 'restart_caddy' && <RefreshCcw className="h-3.5 w-3.5 animate-spin mr-1" />}
              <span>Reload Caddy</span>
            </button>
          </div>
        </div>

        {/* Card 3: Restart PM2 with Selective Target */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.01] flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl border text-amber-500 bg-amber-500/10 border-amber-500/20">
                  <Layers className={`h-5 w-5 ${executingAction === 'restart_pm2' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Restart PM2 Services</h3>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                    Selective Process Reload
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPm2Modal(true)}
                className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                title="View full process list and details"
              >
                <Sliders className="h-3 w-3" />
                <span>Picker</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-mono leading-relaxed">
              Select which specific service to reload, or reload all backend instances simultaneously without dropping traffic.
            </p>

            {/* Target Selector Dropdown */}
            <div className="mt-3 space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                Target Process:
              </label>
              <select
                value={selectedPm2Target}
                onChange={(e) => setSelectedPm2Target(e.target.value)}
                disabled={!!executingAction}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="all">⚡ All PM2 Services (Global Reload)</option>
                {pm2List.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (#{p.id}) • {p.status.toUpperCase()} • {formatBytes(p.memory)} • {p.cpu}% CPU
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 truncate">
              $ pm2 reload "{selectedPm2Target}"
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Target: <strong className="text-slate-700 dark:text-slate-300">{selectedPm2Target}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => runAction('restart_pm2', undefined, selectedPm2Target)}
                disabled={!!executingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-md shadow-amber-500/20 flex items-center space-x-1.5"
              >
                {executingAction === 'restart_pm2' && <RefreshCcw className="h-3.5 w-3.5 animate-spin mr-1" />}
                <span>
                  {selectedPm2Target === 'all' ? 'Reload All PM2' : `Restart ${selectedPm2Target}`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Reboot Server (Danger Zone) */}
        <div className="glass-card rounded-2xl p-5 border border-red-500/30 hover:border-red-500/50 bg-red-500/[0.01] flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl border text-red-500 bg-red-500/10 border-red-500/20">
                  <Power className={`h-5 w-5 ${executingAction === 'reboot' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reboot Host Server</h3>
                  <span className="text-[10px] uppercase font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Danger Zone
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-mono leading-relaxed">
              Initiates a full Linux kernel restart with a 1-minute shutdown grace period. Host will temporarily reboot.
            </p>

            <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 truncate">
              $ shutdown -r +1 "Reboot triggered via Dashboard"
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <button
              onClick={() => setShowRebootModal(true)}
              disabled={!!executingAction}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors shadow-md shadow-red-600/20"
            >
              Reboot Server
            </button>
          </div>
        </div>
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
              placeholder="e.g. pm2 list, pm2 logs --lines 20, systemctl status caddy, ufw status..."
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

      {/* PM2 Process Picker & Detailed Manager Modal */}
      {showPm2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl max-w-xl w-full p-6 border-amber-500/40 bg-white dark:bg-slate-900 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    PM2 Service Selection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Select a process to reload individually or reload the entire cluster
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPm2Modal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {/* Option: Reload All */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">All PM2 Services</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      GLOBAL RELOAD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Gracefully reloads all {pm2List.length} running instances at once
                  </p>
                </div>
                <button
                  onClick={() => runAction('restart_pm2', undefined, 'all')}
                  disabled={!!executingAction}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Reload All
                </button>
              </div>

              {/* List of individual PM2 processes */}
              <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-1">
                Individual Services:
              </p>

              {pm2List.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 border border-dashed rounded-xl">
                  {loadingPm2 ? 'Scanning active PM2 processes...' : 'No PM2 processes found on host.'}
                </div>
              ) : (
                pm2List.map((proc) => {
                  const isOnline = proc.status === 'online';
                  return (
                    <div
                      key={proc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                            {proc.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-slate-500 bg-slate-200 dark:bg-slate-800">
                            #{proc.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center ${
                              isOnline
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full mr-1 ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                              }`}
                            />
                            {proc.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-emerald-500" />
                            CPU: {proc.cpu}%
                          </span>
                          <span>MEM: {formatBytes(proc.memory)}</span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-slate-400" />
                            Uptime: {formatUptime(proc.uptime)}
                          </span>
                          <span>Restarts: {proc.restarts}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSelectedPm2Target(proc.name);
                            runAction('restart_pm2', undefined, proc.name);
                          }}
                          disabled={!!executingAction}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <RefreshCcw className="h-3 w-3" />
                          <span>Restart</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPm2Target(proc.name);
                            runAction('stop_pm2', undefined, proc.name);
                          }}
                          disabled={!!executingAction}
                          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-slate-300 dark:border-slate-800 transition-colors"
                          title={`Stop ${proc.name}`}
                        >
                          <Square className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={fetchPm2List}
                disabled={loadingPm2}
                className="text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              >
                <RefreshCcw className={`h-3 w-3 ${loadingPm2 ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>

              <button
                onClick={() => setShowPm2Modal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

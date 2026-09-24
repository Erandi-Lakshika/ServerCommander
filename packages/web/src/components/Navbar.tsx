import React from 'react';
import { Server, Activity, Power, ShieldCheck, Mail, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { SystemInfo } from '@dashboard/shared';

interface NavbarProps {
  system: SystemInfo | null;
  connected: boolean;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  system,
  connected,
  onLogout,
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
}) => {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Server className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-wide">COMMAND DASHBOARD</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-mono">
                  168.144.134.223
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {system ? `${system.hostname} • ${system.distro} (${system.arch})` : 'Connecting to host...'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            {[
              { id: 'overview', label: 'Telemetry' },
              { id: 'processes', label: 'Processes' },
              { id: 'terminal', label: 'Web Terminal' },
              { id: 'actions', label: 'Actions' },
              { id: 'alerts', label: 'Alerts & Resend' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center space-x-3">
            {/* Live Connection Badge */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              {connected ? (
                <span className="flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
                  LIVE (1s)
                </span>
              ) : (
                <span className="flex items-center text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/50">
                  <WifiOff className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  RECONNECTING
                </span>
              )}
            </div>

            {/* Uptime */}
            {system && (
              <div className="hidden lg:block text-right">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-mono">Uptime</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatUptime(system.uptime)}</p>
              </div>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-slate-700/60 transition-colors"
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Server, Power, WifiOff, Sun, Moon } from 'lucide-react';
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
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand & Host Identifier */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Server className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-wide text-xs sm:text-sm whitespace-nowrap">
                  COMMAND <span className="hidden sm:inline">DASHBOARD</span>
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-mono shrink-0">
                  168.144.134.223
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px] sm:max-w-none">
                {system ? `${system.hostname} • ${system.distro} (${system.arch})` : 'Connecting...'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop only) */}
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Status & Actions Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Live Connection Badge */}
            <div className="flex items-center font-mono">
              {connected ? (
                <span className="flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50 text-[10px] sm:text-xs">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                  <span className="hidden sm:inline mr-1">LIVE</span>(1s)
                </span>
              ) : (
                <span className="flex items-center text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 sm:px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/50 text-[10px] sm:text-xs">
                  <WifiOff className="h-3 w-3 mr-1 animate-pulse" />
                  <span className="hidden sm:inline">RECONNECTING</span>
                </span>
              )}
            </div>

            {/* Uptime (Desktop only) */}
            {system && (
              <div className="hidden lg:block text-right">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-mono">Uptime</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {formatUptime(system.uptime)}
                </p>
              </div>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-slate-700/60 transition-colors"
            >
              <Power className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

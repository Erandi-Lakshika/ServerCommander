import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, Activity, Layers, Terminal as TermIcon, Bell, Compass, Zap } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTelemetry } from './hooks/useTelemetry';
import { Navbar } from './components/Navbar';
import { MetricCard } from './components/MetricCard';
import { LiveCharts } from './components/LiveCharts';
import { ProcessTable } from './components/ProcessTable';
import { WebTerminal } from './components/WebTerminal';
import { QuickActions } from './components/QuickActions';
import { SystemActions } from './components/SystemActions';
import { AlertsManager } from './components/AlertsManager';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  const { token, isAuthenticated, saveAuth, logout } = useAuth();
  const { metrics, history, connected } = useTelemetry(token);
  const [activeTab, setActiveTab] = useState('overview');

  // Theme state: default to dark or saved preference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dashboard_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={saveAuth} />;
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const primaryDisk = metrics?.disks && metrics.disks.length > 0 ? metrics.disks[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      <Navbar
        system={metrics?.system || null}
        connected={connected}
        onLogout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Stat Cards matching Mobile Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="CPU Utilization"
                value={`${metrics?.cpu.usagePercent || 0}%`}
                subValue={metrics?.cpu.brand || `${metrics?.cpu.cores?.length || 1} vCPU Core`}
                extraValue={`Load: ${metrics?.cpu.loadAvg?.map((n) => n.toFixed(2)).join(', ') || '0.00'}`}
                percent={metrics?.cpu.usagePercent || 0}
                icon={Cpu}
                color={
                  (metrics?.cpu.usagePercent || 0) > 80
                    ? 'red'
                    : (metrics?.cpu.usagePercent || 0) > 50
                    ? 'amber'
                    : 'emerald'
                }
              />

              <MetricCard
                title="Memory / RAM"
                value={`${metrics?.memory.percentUsed || 0}%`}
                subValue={`${formatBytes(metrics?.memory.used || 0)} / ${formatBytes(metrics?.memory.total || 0)}`}
                extraValue={`Swap: ${metrics?.memory.swapPercentUsed || 0}% (${formatBytes(metrics?.memory.swapUsed || 0)} / ${formatBytes(metrics?.memory.swapTotal || 0)})`}
                percent={metrics?.memory.percentUsed || 0}
                icon={MemoryStick}
                color={
                  (metrics?.memory.percentUsed || 0) > 85
                    ? 'red'
                    : (metrics?.memory.percentUsed || 0) > 65
                    ? 'amber'
                    : 'purple'
                }
              />

              <MetricCard
                title={`Storage (${primaryDisk?.mount || '/'})`}
                value={`${primaryDisk?.usePercent || 0}%`}
                subValue={`${formatBytes(primaryDisk?.used || 0)} / ${formatBytes(primaryDisk?.size || 0)}`}
                extraValue={`${formatBytes(primaryDisk?.available || 0)} free • ${primaryDisk?.fs || 'ext4'}`}
                percent={primaryDisk?.usePercent || 0}
                icon={HardDrive}
                color={(primaryDisk?.usePercent || 0) > 80 ? 'red' : 'blue'}
              />

              <MetricCard
                title={`Network (${metrics?.network.interface || 'eth0'})`}
                value={`↓ ${formatBytes(metrics?.network.rxSec || 0)}/s`}
                subValue={`↑ ${formatBytes(metrics?.network.txSec || 0)}/s`}
                extraValue={`Total: ↓ ${formatBytes(metrics?.network.rxTotal || 0)} • ↑ ${formatBytes(metrics?.network.txTotal || 0)}`}
                icon={Activity}
                color="emerald"
              />
            </div>

            {/* Live Visual Charts */}
            <LiveCharts history={history} theme={theme} />

            {/* Quick Actions Bar with Link to Full Operations */}
            <QuickActions token={token} onNavigateActions={() => setActiveTab('actions')} />
          </div>
        )}

        {/* TAB 2: PROCESSES */}
        {activeTab === 'processes' && <ProcessTable token={token} />}

        {/* TAB 3: WEB TERMINAL */}
        {activeTab === 'terminal' && <WebTerminal token={token} theme={theme} />}

        {/* TAB 4: SYSTEM ACTIONS & OPERATIONS */}
        {activeTab === 'actions' && <SystemActions token={token} />}

        {/* TAB 5: ALERTS & RESEND */}
        {activeTab === 'alerts' && <AlertsManager token={token} />}
      </main>

      {/* Mobile Bottom Navigation Bar (5 tabs matching Android app) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex justify-around">
        {[
          { id: 'overview', label: 'Stats', icon: Compass },
          { id: 'processes', label: 'Tasks', icon: Layers },
          { id: 'terminal', label: 'Shell', icon: TermIcon },
          { id: 'actions', label: 'Actions', icon: Zap },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

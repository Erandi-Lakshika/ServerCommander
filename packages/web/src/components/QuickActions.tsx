import React, { useState, useEffect } from 'react';
import {
  Zap,
  RefreshCcw,
  Trash2,
  Power,
  Layers,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
  Activity,
  Sliders,
} from 'lucide-react';
import { Pm2ProcessItem } from '@dashboard/shared';

interface QuickActionsProps {
  token: string | null;
  onNavigateActions?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ token, onNavigateActions }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [showPm2Modal, setShowPm2Modal] = useState(false);
  const [pm2List, setPm2List] = useState<Pm2ProcessItem[]>([]);
  const [loadingPm2, setLoadingPm2] = useState(false);

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
      console.error(e);
    } finally {
      setLoadingPm2(false);
    }
  };

  useEffect(() => {
    if (showPm2Modal) {
      fetchPm2List();
    }
  }, [showPm2Modal, token]);

  const runAction = async (action: string, target?: string) => {
    if (!token) return;
    setLoadingAction(action);
    setFeedback(null);

    try {
      const res = await fetch('/api/system/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const targetStr = target ? ` [${target}]` : '';
        setFeedback({
          message: data.output || `Action ${action}${targetStr} completed successfully`,
          isError: false,
        });
      } else {
        setFeedback({ message: data.output || 'Action failed', isError: true });
      }
    } catch (e: any) {
      setFeedback({ message: e.message || 'Request failed', isError: true });
    } finally {
      setLoadingAction(null);
      setShowPm2Modal(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleActionClick = (id: string) => {
    if (id === 'restart_pm2') {
      setShowPm2Modal(true);
    } else {
      runAction(id);
    }
  };

  const actions = [
    {
      id: 'clear_cache',
      title: 'Drop PageCache',
      desc: 'Frees cached RAM memory on host',
      icon: Trash2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'restart_caddy',
      title: 'Reload Caddy',
      desc: 'Hot-reloads proxy & SSL config',
      icon: RefreshCcw,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      id: 'restart_pm2',
      title: 'Restart PM2',
      desc: 'Choose service or reload all',
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'reboot',
      title: 'Reboot Server',
      desc: 'Graceful Linux kernel restart',
      icon: Power,
      color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-3.5 sm:p-5 lg:p-6 mt-3 sm:mt-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Quick Emergency Controls</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">One-click administrative actions</p>
          </div>
        </div>

        {onNavigateActions && (
          <button
            onClick={onNavigateActions}
            className="flex items-center space-x-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
          >
            <span>Full Actions Console</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2 border ${
            feedback.isError
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {feedback.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <span className="truncate">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          const isLoading = loadingAction === act.id;
          return (
            <button
              key={act.id}
              onClick={() => handleActionClick(act.id)}
              disabled={!!loadingAction}
              className="glass-card glass-card-hover rounded-xl p-4 text-left border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start space-x-3 group"
            >
              <div className={`p-2.5 rounded-xl border ${act.color} group-hover:scale-105 transition-transform`}>
                <Icon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{act.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{act.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick PM2 Picker Modal */}
      {showPm2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border-amber-500/40 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select PM2 Service to Restart
                </h3>
              </div>
              <button
                onClick={() => setShowPm2Modal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {/* Option: Reload All */}
              <button
                onClick={() => runAction('restart_pm2', 'all')}
                className="w-full text-left p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    All PM2 Services
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Reload all running backend clusters
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                  Reload All
                </span>
              </button>

              {/* Individual PM2 processes */}
              {pm2List.map((proc) => (
                <button
                  key={proc.id}
                  onClick={() => runAction('restart_pm2', proc.name)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/40 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {proc.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-slate-500 bg-slate-200 dark:bg-slate-800">
                        #{proc.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                      Status: {proc.status} • CPU: {proc.cpu}%
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    Restart
                  </span>
                </button>
              ))}

              {pm2List.length === 0 && (
                <div className="text-center py-4 text-xs font-mono text-slate-500">
                  {loadingPm2 ? 'Checking PM2 services...' : 'Loading services...'}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPm2Modal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Zap, RefreshCcw, Trash2, Power, CheckCircle, AlertCircle } from 'lucide-react';

interface QuickActionsProps {
  token: string | null;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ token }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const runAction = async (action: string) => {
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
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ message: data.output || `Action ${action} completed successfully`, isError: false });
      } else {
        setFeedback({ message: data.output || 'Action failed', isError: true });
      }
    } catch (e: any) {
      setFeedback({ message: e.message || 'Request failed', isError: true });
    } finally {
      setLoadingAction(null);
      setTimeout(() => setFeedback(null), 5000);
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
      desc: 'Restarts SSL & reverse proxy service',
      icon: RefreshCcw,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      id: 'reboot',
      title: 'Schedule Reboot',
      desc: 'Gracefully reboots VPS in 1 minute',
      icon: Power,
      color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 mt-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Quick Emergency Controls</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">One-click administrative actions</p>
        </div>
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
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          const isLoading = loadingAction === act.id;
          return (
            <button
              key={act.id}
              onClick={() => runAction(act.id)}
              disabled={!!loadingAction}
              className="glass-card glass-card-hover rounded-xl p-4 text-left border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start space-x-3 group"
            >
              <div className={`p-2.5 rounded-xl border ${act.color} group-hover:scale-105 transition-transform`}>
                <Icon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{act.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

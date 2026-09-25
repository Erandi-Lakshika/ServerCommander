import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  extraValue?: string;
  percent?: number;
  icon: LucideIcon;
  color?: 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  extraValue,
  percent,
  icon: Icon,
  color = 'emerald',
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return {
          icon: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
          bar: 'bg-red-500',
        };
      case 'amber':
        return {
          icon: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          bar: 'bg-amber-500',
        };
      case 'blue':
        return {
          icon: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
          bar: 'bg-blue-500',
        };
      case 'purple':
        return {
          icon: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
          bar: 'bg-purple-500',
        };
      case 'emerald':
      default:
        return {
          icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          bar: 'bg-emerald-500',
        };
    }
  };

  const style = getColorClasses();

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <div className="mt-1 flex items-baseline space-x-1.5 sm:space-x-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{value}</span>
            {percent !== undefined && (
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">({percent}%)</span>
            )}
          </div>
          {subValue && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono truncate">{subValue}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl border shrink-0 ${style.icon}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {percent !== undefined && (
        <div className="mt-4 w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${style.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      )}

      {extraValue && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono truncate border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
          {extraValue}
        </p>
      )}
    </div>
  );
};

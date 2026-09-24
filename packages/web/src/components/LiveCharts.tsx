import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { MetricDataPoint } from '../hooks/useTelemetry';

interface LiveChartsProps {
  history: MetricDataPoint[];
  theme?: 'dark' | 'light';
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ history, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#090d16' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* CPU & Memory Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">CPU & Memory Utilization</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Live dynamic load timeline</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1.5" />
              CPU %
            </span>
            <span className="flex items-center text-purple-600 dark:text-purple-400">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 mr-1.5" />
              RAM %
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '10px',
                  color: tooltipText,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU Load"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cpuGradient)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="memory"
                name="RAM Load"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#memGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Rx / Tx Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Network Throughput</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Real-time Bandwidth (KB/s)</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center text-sky-600 dark:text-sky-400">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 mr-1.5" />
              Download (Rx)
            </span>
            <span className="flex items-center text-amber-600 dark:text-amber-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5" />
              Upload (Tx)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit=" KB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '10px',
                  color: tooltipText,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rxKb"
                name="Inbound (Rx)"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rxGradient)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="txKb"
                name="Outbound (Tx)"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#txGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

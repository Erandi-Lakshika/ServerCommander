import React, { useState, useEffect } from 'react';
import { Search, Skull, RefreshCw, AlertTriangle, X, ArrowUpDown, Cpu, MemoryStick, Hash } from 'lucide-react';
import { ProcessItem } from '@dashboard/shared';

interface ProcessTableProps {
  token: string | null;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ token }) => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'pid'>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [targetPid, setTargetPid] = useState<ProcessItem | null>(null);
  const [killMessage, setKillMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchProcesses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/system/processes?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch (e) {
      console.error('Error fetching processes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, [token]);

  const handleKill = async (pid: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/system/processes/kill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pid, signal: 'SIGTERM' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKillMessage({ text: data.message || `Terminated PID ${pid} successfully`, isError: false });
        fetchProcesses();
      } else {
        setKillMessage({ text: data.message || 'Failed to terminate process', isError: true });
      }
    } catch (err: any) {
      setKillMessage({ text: err.message || 'Network error', isError: true });
    } finally {
      setTargetPid(null);
      setTimeout(() => setKillMessage(null), 4000);
    }
  };

  const handleSortToggle = (type: 'cpu' | 'mem' | 'pid') => {
    if (sortBy === type) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toString().includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'cpu') {
      diff = a.cpu - b.cpu;
    } else if (sortBy === 'mem') {
      diff = a.mem - b.mem;
    } else if (sortBy === 'pid') {
      diff = a.pid - b.pid;
    }
    return sortOrder === 'desc' ? -diff : diff;
  });

  return (
    <div className="glass-card rounded-2xl p-6 mt-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Live Process Manager</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
              {sorted.length} processes {search ? 'found' : 'running'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Real-time inspection of active Linux processes with sorting and kill capabilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sorting Chips matching Mobile App */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handleSortToggle('cpu')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'cpu'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="h-3 w-3" />
              <span>CPU %</span>
              {sortBy === 'cpu' && (
                <span className="text-[10px] ml-0.5">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>

            <button
              onClick={() => handleSortToggle('mem')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'mem'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MemoryStick className="h-3 w-3" />
              <span>RAM %</span>
              {sortBy === 'mem' && (
                <span className="text-[10px] ml-0.5">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>

            <button
              onClick={() => handleSortToggle('pid')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'pid'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Hash className="h-3 w-3" />
              <span>PID</span>
              {sortBy === 'pid' && (
                <span className="text-[10px] ml-0.5">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search process, user, PID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-48 sm:w-56 font-mono transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchProcesses}
            disabled={loading}
            title="Refresh process list"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {killMessage && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-mono border ${
            killMessage.isError
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {killMessage.text}
        </div>
      )}

      {/* Process Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">PID</th>
              <th className="py-3 px-4">Process Name</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">CPU %</th>
              <th className="py-3 px-4">MEM %</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  {search ? `No processes matching "${search}"` : 'No active processes found'}
                </td>
              </tr>
            ) : (
              sorted.map((proc) => (
                <tr key={proc.pid} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-bold">{proc.pid}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white truncate max-w-xs" title={proc.command}>
                    {proc.name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{proc.user}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        proc.cpu > 50
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 font-bold'
                          : proc.cpu > 20
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {proc.cpu.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        proc.mem > 40
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {proc.mem.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setTargetPid(proc)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors"
                      title="Kill Process"
                    >
                      <Skull className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Kill Modal Confirmation */}
      {targetPid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border-red-500/30 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Terminate Process?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-mono leading-relaxed">
              Are you sure you want to send <span className="text-red-500 font-bold">SIGTERM</span> to{' '}
              <span className="text-slate-900 dark:text-white font-bold">{targetPid.name}</span> (PID{' '}
              <span className="text-slate-900 dark:text-white font-bold">{targetPid.pid}</span>)?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setTargetPid(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKill(targetPid.pid)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
              >
                Kill Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

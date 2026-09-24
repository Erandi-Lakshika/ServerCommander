import si from 'systeminformation';
import { ProcessItem } from '@dashboard/shared';

export async function getRunningProcesses(limit = 60): Promise<ProcessItem[]> {
  const data = await si.processes();
  const sorted = data.list
    .sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)
    .slice(0, limit);

  return sorted.map((p) => ({
    pid: p.pid,
    name: p.name,
    cpu: Math.round(p.cpu * 10) / 10,
    mem: Math.round(p.mem * 10) / 10,
    user: p.user || 'system',
    command: p.command || p.name,
    priority: p.priority || 0,
  }));
}

export async function killProcessByPid(pid: number, signal: 'SIGTERM' | 'SIGKILL' = 'SIGTERM'): Promise<{ success: boolean; message: string }> {
  try {
    if (pid <= 1) {
      return { success: false, message: 'Cannot terminate system root init process' };
    }
    process.kill(pid, signal);
    return { success: true, message: `Successfully sent ${signal} to process ${pid}` };
  } catch (error: any) {
    return { success: false, message: error.message || `Failed to kill process ${pid}` };
  }
}

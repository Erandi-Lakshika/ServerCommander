import si from 'systeminformation';
import { ServerMetrics, SystemInfo, CpuMetrics, MemoryMetrics, DiskMetrics, NetworkMetrics } from '@dashboard/shared';

let cachedSystemInfo: SystemInfo | null = null;

export async function getSystemInfo(): Promise<SystemInfo> {
  if (cachedSystemInfo) {
    const time = si.time();
    return {
      ...cachedSystemInfo,
      uptime: time.uptime,
    };
  }

  const [osInfo, time] = await Promise.all([
    si.osInfo(),
    si.time(),
  ]);

  cachedSystemInfo = {
    hostname: osInfo.hostname || 'Unknown Host',
    platform: osInfo.platform,
    distro: osInfo.distro,
    release: osInfo.release,
    uptime: time.uptime,
    arch: osInfo.arch,
    nodeVersion: process.version,
  };

  return cachedSystemInfo;
}

export async function getLiveMetrics(): Promise<ServerMetrics> {
  const [system, cpuData, memData, fsData, netData, cpuTemp] = await Promise.all([
    getSystemInfo(),
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
    si.cpuTemperature().catch(() => ({ main: undefined })),
  ]);

  const cpu: CpuMetrics = {
    usagePercent: Math.round(cpuData.currentLoad * 10) / 10,
    cores: cpuData.cpus.map((c) => Math.round(c.load * 10) / 10),
    loadAvg: [
      Math.round(cpuData.avgLoad * 100) / 100,
      Math.round(cpuData.avgLoad * 100) / 100,
      Math.round(cpuData.avgLoad * 100) / 100,
    ],
    brand: cpuData.cpus.length > 0 ? `vCPU (${cpuData.cpus.length} cores)` : 'System CPU',
    speed: 0,
    temperature: cpuTemp.main || undefined,
  };

  const memory: MemoryMetrics = {
    total: memData.total,
    used: memData.used,
    free: memData.free,
    available: memData.available,
    percentUsed: Math.round((memData.used / memData.total) * 1000) / 10,
    swapTotal: memData.swaptotal,
    swapUsed: memData.swapused,
    swapFree: memData.swapfree,
    swapPercentUsed: memData.swaptotal > 0 ? Math.round((memData.swapused / memData.swaptotal) * 1000) / 10 : 0,
  };

  const disks: DiskMetrics[] = fsData.map((fs) => ({
    fs: fs.fs,
    type: fs.type,
    size: fs.size,
    used: fs.used,
    available: fs.available,
    usePercent: Math.round(fs.use * 10) / 10,
    mount: fs.mount,
  }));

  const primaryNet = netData && netData.length > 0 ? netData[0] : null;
  const network: NetworkMetrics = {
    interface: primaryNet ? primaryNet.iface : 'default',
    rxSec: primaryNet ? Math.max(0, primaryNet.rx_sec || 0) : 0,
    txSec: primaryNet ? Math.max(0, primaryNet.tx_sec || 0) : 0,
    rxTotal: primaryNet ? primaryNet.rx_bytes || 0 : 0,
    txTotal: primaryNet ? primaryNet.tx_bytes || 0 : 0,
  };

  return {
    timestamp: Date.now(),
    system,
    cpu,
    memory,
    disks,
    network,
  };
}

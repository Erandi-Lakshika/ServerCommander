export interface CpuMetrics {
  usagePercent: number;
  cores: number[];
  loadAvg: [number, number, number];
  brand: string;
  speed: number;
  temperature?: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  available: number;
  percentUsed: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
  swapPercentUsed: number;
}

export interface DiskMetrics {
  fs: string;
  type: string;
  size: number;
  used: number;
  available: number;
  usePercent: number;
  mount: string;
}

export interface NetworkMetrics {
  interface: string;
  rxSec: number;
  txSec: number;
  rxTotal: number;
  txTotal: number;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  distro: string;
  release: string;
  uptime: number; // in seconds
  arch: string;
  nodeVersion: string;
}

export interface ServerMetrics {
  timestamp: number;
  system: SystemInfo;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disks: DiskMetrics[];
  network: NetworkMetrics;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  user: string;
  command: string;
  priority: number;
}

export interface ServiceItem {
  name: string;
  description: string;
  loadState: string;
  activeState: string;
  subState: string;
}

export interface DockerItem {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  created: number;
}

export interface AlertConfig {
  emailRecipient: string;
  cpuThreshold: number; // e.g. 90
  memThreshold: number; // e.g. 90
  diskThreshold: number; // e.g. 85
  enabled: boolean;
  resendApiKey?: string;
}

export interface AlertEvent {
  id: string;
  timestamp: number;
  type: 'CPU' | 'MEMORY' | 'DISK' | 'SERVICE' | 'SYSTEM';
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  message: string;
  resolved: boolean;
}

export interface UserSession {
  username: string;
  role: 'admin' | 'viewer';
}

export interface LoginResponse {
  token: string;
  user: UserSession;
}

export interface QuickActionRequest {
  action: 'reboot' | 'restart_caddy' | 'restart_nginx' | 'clear_cache' | 'custom';
  customCommand?: string;
}

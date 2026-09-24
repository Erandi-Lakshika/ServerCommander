import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { ServiceItem } from '@dashboard/shared';

const execAsync = promisify(exec);

export async function executeQuickAction(action: string, customCommand?: string): Promise<{ success: boolean; output: string }> {
  const isLinux = os.platform() === 'linux';

  try {
    let command = '';
    switch (action) {
      case 'clear_cache':
        command = isLinux ? 'sync && echo 3 > /proc/sys/vm/drop_caches' : 'echo "Cache clear not supported on this OS"';
        break;
      case 'restart_caddy':
        command = isLinux ? 'systemctl reload caddy || systemctl restart caddy' : 'echo "Caddy service not on Linux"';
        break;
      case 'restart_nginx':
        command = isLinux ? 'systemctl restart nginx' : 'echo "Nginx service not on Linux"';
        break;
      case 'restart_pm2':
        command = isLinux ? 'pm2 reload all || pm2 restart all' : 'echo "PM2 not supported on this OS"';
        break;
      case 'reboot':
        command = isLinux ? 'shutdown -r +1 "Reboot triggered by admin via Dashboard"' : 'shutdown /r /t 60';
        break;
      case 'custom':
        if (!customCommand || !customCommand.trim()) {
          return { success: false, output: 'No command provided to execute' };
        }
        command = customCommand.trim();
        break;
      default:
        return { success: false, output: `Unknown action: ${action}` };
    }

    const { stdout, stderr } = await execAsync(command);
    return {
      success: true,
      output: stdout || stderr || `Action ${action} executed successfully`,
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stderr || error.message || `Failed to execute ${action}`,
    };
  }
}

export async function getSystemServices(): Promise<ServiceItem[]> {
  if (os.platform() !== 'linux') {
    return [
      { name: 'mock-web', description: 'Mock Web Server', loadState: 'loaded', activeState: 'active', subState: 'running' },
      { name: 'mock-db', description: 'Mock Database', loadState: 'loaded', activeState: 'active', subState: 'running' },
    ];
  }

  try {
    const { stdout } = await execAsync('systemctl list-units --type=service --state=running --no-pager --no-legend | head -n 25');
    const lines = stdout.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const name = parts[0] || 'unknown';
      const loadState = parts[1] || 'loaded';
      const activeState = parts[2] || 'active';
      const subState = parts[3] || 'running';
      const description = parts.slice(4).join(' ') || name;
      return { name, description, loadState, activeState, subState };
    });
  } catch (e) {
    return [];
  }
}

import { Router, Request, Response } from 'express';
import { getLiveMetrics } from '../services/telemetry';
import { getRunningProcesses, killProcessByPid } from '../services/processService';
import { executeQuickAction, getSystemServices, getPm2Processes } from '../services/systemService';
import { authenticateToken } from './auth';

export const systemRouter = Router();

// Protect all system routes
systemRouter.use(authenticateToken);

// GET /api/system/metrics
systemRouter.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getLiveMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch metrics' });
  }
});

// GET /api/system/processes
systemRouter.get('/processes', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 60;
    const processes = await getRunningProcesses(limit);
    res.json(processes);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch processes' });
  }
});

// POST /api/system/processes/kill
systemRouter.post('/processes/kill', async (req: Request, res: Response) => {
  const { pid, signal } = req.body;
  if (!pid || typeof pid !== 'number') {
    return res.status(400).json({ error: 'Valid PID is required' });
  }

  const result = await killProcessByPid(pid, signal || 'SIGTERM');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// GET /api/system/services
systemRouter.get('/services', async (_req: Request, res: Response) => {
  try {
    const services = await getSystemServices();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
});

// GET /api/system/pm2
systemRouter.get('/pm2', async (_req: Request, res: Response) => {
  try {
    const pm2List = await getPm2Processes();
    res.json(pm2List);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch PM2 list' });
  }
});

// POST /api/system/actions
systemRouter.post('/actions', async (req: Request, res: Response) => {
  const { action, customCommand, target } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Action name is required' });
  }

  // If reloading PM2 (which may restart this server process), respond first to prevent socket termination
  if (action === 'restart_pm2') {
    const cleanTarget = target && target.trim() !== 'all' ? target.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '') : 'all';
    res.json({
      success: true,
      output: `Reload dispatched to PM2 target: "${cleanTarget}". Process is restarting gracefully.`
    });

    setTimeout(() => {
      executeQuickAction(action, customCommand, target).catch(() => {});
    }, 200);
    return;
  }

  const result = await executeQuickAction(action, customCommand, target);
  return res.json(result);
});

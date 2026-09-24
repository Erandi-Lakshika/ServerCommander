import { Router, Request, Response } from 'express';
import { alertService } from '../services/alertService';
import { authenticateToken } from './auth';

export const alertsRouter = Router();

alertsRouter.use(authenticateToken);

// GET /api/alerts/config
alertsRouter.get('/config', (_req: Request, res: Response) => {
  res.json(alertService.getConfig());
});

// POST /api/alerts/config
alertsRouter.post('/config', (req: Request, res: Response) => {
  const updated = alertService.updateConfig(req.body);
  res.json(updated);
});

// GET /api/alerts/events
alertsRouter.get('/events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(alertService.getEvents(limit));
});

// POST /api/alerts/test
alertsRouter.post('/test', async (req: Request, res: Response) => {
  const result = await alertService.triggerAlert({
    type: 'SYSTEM',
    severity: 'INFO',
    title: 'Manual Test Alert',
    message: req.body.message || 'This is a test notification dispatched from your Server Dashboard.',
  });
  res.json(result);
});

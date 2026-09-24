import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';

export const authRouter = Router();

// Middleware to authenticate JWT
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, CONFIG.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
      const user = { username: CONFIG.ADMIN_USERNAME, role: 'admin' };
      const token = jwt.sign(user, CONFIG.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error: ' + (error.message || 'unknown') });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

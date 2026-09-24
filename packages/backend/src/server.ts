import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { CONFIG } from './config';
import { authRouter } from './routes/auth';
import { systemRouter } from './routes/system';
import { alertsRouter } from './routes/alerts';
import { getLiveMetrics } from './services/telemetry';
import { alertService } from './services/alertService';
import { setupTerminalSession } from './services/terminalService';

const app = express();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows xterm and charts to render cleanly
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/system', systemRouter);
app.use('/api/alerts', alertsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Serve frontend static build if available
const webDistPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// Fallback to index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Server Dashboard API is running. Web client build in progress.');
    }
  });
});

const server = http.createServer(app);

// WebSockets Server
const wssMetrics = new WebSocketServer({ noServer: true });
const wssTerminal = new WebSocketServer({ noServer: true });

function verifyTokenFromUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return false;
    jwt.verify(token, CONFIG.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', 'http://localhost').pathname;

  // Authenticate WebSocket connection
  const isAuthenticated = verifyTokenFromUrl(request.url || '');
  if (!isAuthenticated) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  if (pathname === '/ws/metrics') {
    wssMetrics.handleUpgrade(request, socket, head, (ws) => {
      wssMetrics.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/terminal') {
    wssTerminal.handleUpgrade(request, socket, head, (ws) => {
      wssTerminal.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Terminal WebSocket handler
wssTerminal.on('connection', (ws: WebSocket) => {
  setupTerminalSession(ws);
});

// Telemetry Broadcast Loop
let lastMetricsJson = '';
setInterval(async () => {
  if (wssMetrics.clients.size === 0) return;

  try {
    const metrics = await getLiveMetrics();
    await alertService.evaluateMetrics(metrics);

    lastMetricsJson = JSON.stringify({ type: 'telemetry', data: metrics });
    wssMetrics.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(lastMetricsJson);
      }
    });
  } catch (err) {
    console.error('Error broadcasting telemetry metrics:', err);
  }
}, CONFIG.METRICS_INTERVAL_MS);

// Send initial telemetry on connection
wssMetrics.on('connection', async (ws: WebSocket) => {
  try {
    if (lastMetricsJson) {
      ws.send(lastMetricsJson);
    } else {
      const metrics = await getLiveMetrics();
      ws.send(JSON.stringify({ type: 'telemetry', data: metrics }));
    }
  } catch (e) {
    console.error('Error sending initial metrics:', e);
  }
});

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Server Dashboard Backend running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`🌐 Live Domain: https://dashboard.ictevents.space`);
  console.log(`🔑 Admin Username: ${CONFIG.ADMIN_USERNAME}`);
  console.log(`=======================================================`);
});

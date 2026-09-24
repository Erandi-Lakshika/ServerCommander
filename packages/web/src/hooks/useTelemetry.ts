import { useState, useEffect, useRef } from 'react';
import { ServerMetrics } from '@dashboard/shared';

export interface MetricDataPoint {
  time: string;
  cpu: number;
  memory: number;
  rxKb: number;
  txKb: number;
}

export function useTelemetry(token: string | null) {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [history, setHistory] = useState<MetricDataPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/metrics?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'telemetry') {
            const data: ServerMetrics = message.data;
            if (isMounted) {
              setMetrics(data);
              const now = new Date(data.timestamp);
              const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

              setHistory((prev) => {
                const next = [
                  ...prev,
                  {
                    time: timeStr,
                    cpu: data.cpu.usagePercent,
                    memory: data.memory.percentUsed,
                    rxKb: Math.round((data.network.rxSec / 1024) * 10) / 10,
                    txKb: Math.round((data.network.txSec / 1024) * 10) / 10,
                  },
                ];
                return next.slice(-30); // Keep last 30 readings
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket telemetry message:', e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [token]);

  return { metrics, history, connected };
}

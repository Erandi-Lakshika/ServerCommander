import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, RotateCcw } from 'lucide-react';

interface WebTerminalProps {
  token: string | null;
  theme?: 'dark' | 'light';
}

export const WebTerminal: React.FC<WebTerminalProps> = ({ token, theme = 'dark' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const initTerminal = () => {
    if (!terminalRef.current || !token) return;

    if (termInstance.current) {
      termInstance.current.dispose();
      termInstance.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const term = new Terminal({
      theme: {
        background: '#090d16',
        foreground: '#f8fafc',
        cursor: '#22c55e',
        selectionBackground: 'rgba(34, 197, 94, 0.3)',
      },
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    fitAddonRef.current = fitAddon;
    termInstance.current = term;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[32m✔ WebSocket connection established with host shell.\x1b[0m');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'stdout') {
          term.write(payload.data);
        }
      } catch {
        term.write(event.data);
      }
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[31m✖ Shell connection terminated.\x1b[0m');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdin', data }));
      }
    });
  };

  useEffect(() => {
    initTerminal();

    const handleResize = () => {
      if (fitAddonRef.current) fitAddonRef.current.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (termInstance.current) termInstance.current.dispose();
      if (socketRef.current) socketRef.current.close();
    };
  }, [token]);

  return (
    <div className="glass-card rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TerminalIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Interactive Web Terminal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Live remote shell session</p>
          </div>
        </div>

        <button
          onClick={initTerminal}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      <div
        ref={terminalRef}
        className="w-full h-96 bg-[#090d16] rounded-xl p-3 border border-slate-700 dark:border-slate-800 overflow-hidden shadow-inner"
      />
    </div>
  );
};

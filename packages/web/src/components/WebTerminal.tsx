import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, RotateCcw, Trash2, Send, ChevronRight } from 'lucide-react';

interface WebTerminalProps {
  token: string | null;
  theme?: 'dark' | 'light';
}

export const WebTerminal: React.FC<WebTerminalProps> = ({ token, theme = 'dark' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [connected, setConnected] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  const presetChips = [
    { label: 'free -h', cmd: 'free -h' },
    { label: 'df -h', cmd: 'df -h' },
    { label: 'uptime', cmd: 'uptime' },
    { label: 'pm2 status', cmd: 'pm2 status' },
    { label: 'systemctl status caddy', cmd: 'systemctl status caddy' },
    { label: 'netstat -tlpn', cmd: 'netstat -tlpn' },
    { label: 'docker ps', cmd: 'docker ps' },
    { label: 'journalctl -n 20', cmd: 'journalctl -n 20' },
  ];

  const safeFitAndScroll = useCallback(() => {
    if (!fitAddonRef.current || !termInstance.current || !terminalRef.current) return;
    try {
      fitAddonRef.current.fit();
      termInstance.current.scrollToBottom();
    } catch (e) {
      // Ignored if terminal is unmounted or layout not ready
    }
  }, []);

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
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    const term = new Terminal({
      theme: {
        background: '#090d16',
        foreground: '#f8fafc',
        cursor: '#22c55e',
        selectionBackground: 'rgba(34, 197, 94, 0.3)',
      },
      fontFamily: 'JetBrains Mono, Menlo, Courier New, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
      scrollOnUserInput: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    fitAddonRef.current = fitAddon;
    termInstance.current = term;

    // Trigger initial fit and ensure fonts are ready
    requestAnimationFrame(() => {
      safeFitAndScroll();
      if (document.fonts) {
        document.fonts.ready.then(() => {
          safeFitAndScroll();
        });
      }
    });

    // ResizeObserver watches the actual element dimensions
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        safeFitAndScroll();
      });
    });
    resizeObserver.observe(terminalRef.current);
    resizeObserverRef.current = resizeObserver;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      term.writeln('\x1b[32m✔ Interactive Web Shell connected to host.\x1b[0m');
      term.writeln('\x1b[90mTip: Tap preset command chips below or type directly.\x1b[0m\r\n');
      term.scrollToBottom();
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'stdout') {
          term.write(payload.data, () => {
            term.scrollToBottom();
          });
        }
      } catch {
        term.write(event.data, () => {
          term.scrollToBottom();
        });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      term.writeln('\r\n\x1b[31m✖ Shell connection closed.\x1b[0m');
      term.scrollToBottom();
    };

    ws.onerror = () => {
      setConnected(false);
      term.writeln('\r\n\x1b[31m✖ WebSocket error encountered.\x1b[0m');
      term.scrollToBottom();
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdin', data }));
        term.scrollToBottom();
      }
    });
  };

  useEffect(() => {
    initTerminal();

    const handleResize = () => {
      safeFitAndScroll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (termInstance.current) termInstance.current.dispose();
      if (socketRef.current) socketRef.current.close();
    };
  }, [token, safeFitAndScroll]);

  const sendCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stdin', data: `${cmd.trim()}\r` }));
      if (termInstance.current) {
        termInstance.current.focus();
        termInstance.current.scrollToBottom();
      }
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      sendCommand(commandInput);
      setCommandInput('');
    }
  };

  const clearTerminal = () => {
    if (termInstance.current) {
      termInstance.current.clear();
      termInstance.current.writeln('\x1b[90mTerminal output cleared.\x1b[0m\r\n');
      termInstance.current.scrollToBottom();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 mt-6">
      {/* Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TerminalIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Interactive Web Terminal
              </h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  connected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                }`}
              >
                {connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Live pty-based root shell session on host (168.144.134.223)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Clear terminal screen"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={initTerminal}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Restart shell session"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Command Chips matching Mobile App */}
      <div className="mb-3">
        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1.5 flex items-center">
          <ChevronRight className="h-3 w-3 mr-1 text-emerald-500" />
          Quick Preset Commands:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {presetChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendCommand(chip.cmd)}
              disabled={!connected}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5 transition-all shadow-sm disabled:opacity-50"
            >
              $ {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Outer Frame with Dedicated Bottom Padding Buffer */}
      <div className="w-full bg-[#090d16] rounded-xl border border-slate-700 dark:border-slate-800 shadow-inner px-4 pt-4 pb-6 overflow-hidden">
        {/* Terminal Viewport (Zero padding so xterm calculations are pixel-exact) */}
        <div
          ref={terminalRef}
          className="w-full h-[420px]"
        />
      </div>

      {/* Mobile/Touch Quick Command Dispatcher */}
      <form onSubmit={handleInputSubmit} className="mt-3 flex items-center space-x-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 font-mono text-xs">
            $
          </span>
          <input
            type="text"
            placeholder="Type command here and hit Enter or Send..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={!connected}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-7 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!connected || !commandInput.trim()}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/20"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

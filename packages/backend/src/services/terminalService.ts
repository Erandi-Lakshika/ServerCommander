import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import os from 'os';
import { WebSocket } from 'ws';

export function setupTerminalSession(ws: WebSocket) {
  const isWindows = os.platform() === 'win32';
  const shell = isWindows ? 'powershell.exe' : '/bin/bash';
  const args = isWindows ? [] : ['-i'];

  let termProcess: ChildProcessWithoutNullStreams | null = null;

  try {
    termProcess = spawn(shell, args, {
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    ws.send(JSON.stringify({ type: 'stdout', data: `\r\n--- Connected to ${os.hostname()} (${os.platform()}) ---\r\n$ ` }));

    termProcess.stdout.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
      }
    });

    termProcess.stderr.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
      }
    });

    termProcess.on('close', (code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdout', data: `\r\n[Process exited with code ${code}]\r\n` }));
        ws.close();
      }
    });

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'stdin' && termProcess && termProcess.stdin) {
          termProcess.stdin.write(parsed.data);
        }
      } catch (e) {
        // Raw string input fallback
        if (termProcess && termProcess.stdin) {
          termProcess.stdin.write(message.toString());
        }
      }
    });

    ws.on('close', () => {
      if (termProcess) {
        termProcess.kill();
        termProcess = null;
      }
    });
  } catch (err: any) {
    ws.send(JSON.stringify({ type: 'stdout', data: `\r\nFailed to start terminal: ${err.message}\r\n` }));
    ws.close();
  }
}

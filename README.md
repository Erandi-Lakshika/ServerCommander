# 🚀 Server Commander — Modern VPS Monitoring & Management System

> A full-stack, real-time server monitoring and administration platform featuring a **Web Dashboard**, a **100% Native Java Android Mobile Application**, and a lightweight **Node.js Telemetry Engine** with **Resend Email Alerts**.

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![Android](https://img.shields.io/badge/Android-Java_17_|_SDK_34-brightgreen.svg)
![Node](https://img.shields.io/badge/Node.js-v20_LTS-blue.svg)
![React](https://img.shields.io/badge/React_18-Vite_|_Tailwind_CSS-cyan.svg)
![WebSocket](https://img.shields.io/badge/WebSockets-Real--Time_Push-purple.svg)

---

## 🌟 Key Features

### 1. 📊 Real-Time Server Telemetry
- Sub-second updates via bi-directional **WebSockets** (`ws` / `wss`).
- **CPU**: Multi-core breakdown, utilization percentage, load averages (1m, 5m, 15m).
- **Memory & Swap**: Active RAM, cached page buffers, swap allocation, total memory distribution.
- **Storage**: Mount point capacity, filesystem types (`ext4`, `vfat`), available disk space.
- **Bandwidth**: Real-time Rx/Tx network throughput speed with total cumulative volume.

### 2. ⚡ Process Explorer & Task Manager
- Live process listing with instant search filtering by process name, PID, or user.
- Multi-column sorting: **CPU % ▼**, **RAM %**, and **PID**.
- Safe process termination: One-tap kill with confirmation dialog dispatching `SIGTERM`.

### 3. 💻 Remote Interactive Web Shell
- Streaming monospace console with ANSI color filtering and auto-scroll.
- Preset one-tap command chips (`free -h`, `df -h`, `uptime`, `pm2 status`, `systemctl status caddy`, `netstat -tlpn`).
- Direct shell input with software keyboard integration and automatic REST fallback.

### 4. 🚨 Automated Incident Alerts (via Resend)
- Automated alerts when CPU, Memory, or Disk usage exceeds configurable thresholds (default: 90%).
- Integrated with [Resend](https://resend.com) for transactional email delivery.
- One-click "Send Test Alert Email" button to verify delivery.
- Persistent incident event history feed.

### 5. 🛠️ System Operations & Emergency Controls
- **Drop PageCache**: Instantly flushes Linux filesystem buffers (`sync; echo 3 > /proc/sys/vm/drop_caches`).
- **Reload Caddy**: Gracefully reloads reverse proxy configurations and SSL certificates without dropping connections.
- **Restart PM2**: Recycles managed Node.js backend processes.
- **Reboot Host**: Two-step confirmation danger zone to reboot remote servers.

### 6. 🌓 Dual Mode: Light & Dark Themes
- Seamless **Day/Night Theme** toggling across both the Web client and the Native Android app.
- Preferences automatically saved in `localStorage` (Web) and `SharedPreferences` (Android).

---

## 📐 Project Structure

```
ServerDashBoard/
├── android/                        # 📱 Native Java Android App
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/space/ictevents/dashboard/
│   │   │   │   ├── api/            # OkHttp REST & WebSocket Client
│   │   │   │   ├── models/         # ServerMetrics, ProcessItem, Alert POJOs
│   │   │   │   ├── adapters/       # Process & Alert RecyclerView Adapters
│   │   │   │   ├── utils/          # SessionManager, FormatUtils
│   │   │   │   └── ui/             # LoginActivity, MainActivity, 5 Fragments
│   │   │   └── res/                # Material3 Layouts, Colors, Vectors, Adaptive Icons
│   │   └── build.gradle
│   └── build.gradle
│
├── packages/
│   ├── backend/                    # 🚀 Lightweight Telemetry API & WebSockets
│   │   ├── src/
│   │   │   ├── routes/             # Auth, System, and Alerts Routers
│   │   │   ├── services/           # Telemetry, Process, Terminal, and Resend Services
│   │   │   └── server.ts           # Express HTTP + WebSocket Server
│   │   └── package.json
│   │
│   ├── web/                        # 🌐 Modern React + Vite Dashboard
│   │   ├── src/
│   │   │   ├── components/         # MetricCard, LiveCharts, ProcessTable, WebTerminal
│   │   │   ├── hooks/              # useTelemetry, useAuth
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   └── shared/                     # 📦 Shared TypeScript Types & Models
│       └── src/index.ts
│
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Java JDK**: Java 17 or Java 21 (for Android builds)
- **Android Studio** (optional, for running Android app on emulator/device)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Erandi-Lakshika/ServerCommander.git
cd ServerCommander
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `packages/backend/.env`:
```bash
cp .env.example packages/backend/.env
```
Edit `packages/backend/.env` with your desired admin credentials and Resend API key:
```env
PORT=3001
HOST=0.0.0.0
JWT_SECRET=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
RESEND_API_KEY=re_your_key_here
ALERT_EMAIL_RECIPIENT=your-email@example.com
```

### 3. Build & Run Locally

#### Run Backend:
```bash
cd packages/backend
npm run build
npm start
```

#### Run Web Dashboard (Dev Mode):
```bash
cd packages/web
npm run dev
# Visit http://localhost:3000 (proxies to backend automatically)
```

---

## 📱 Native Android App Build

### Build Debug APK:
```bash
cd android
./gradlew assembleDebug
```
The output APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Open in Android Studio:
1. Launch Android Studio.
2. Select **Open** and choose the `android/` directory.
3. Click **Run (▶)** to deploy to an emulator or connected phone.

---

## 🌐 Production VPS Deployment

The backend runs exceptionally well on compact cloud tiers (such as 512MB RAM VPS instances) by pairing **Node.js PM2** with **Caddy** for automated Let's Encrypt SSL:

```caddy
yourdomain.com {
    reverse_proxy 127.0.0.1:3001
}
```

```bash
pm2 start dist/server.js --name "server-dashboard" --max-memory-restart 120M
pm2 save
pm2 startup
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

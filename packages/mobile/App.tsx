import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ServerMetrics, ProcessItem, AlertConfig, AlertEvent } from '@dashboard/shared';

const DEFAULT_SERVER_URL = 'https://dashboard.ictevents.space';

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  // Live Data States
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<{ cpu: number; mem: number }[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [processSearch, setProcessSearch] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'mem'>('cpu');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'processes' | 'terminal' | 'alerts' | 'actions'>('telemetry');
  const [actionLoading, setActionLoading] = useState(false);

  // Terminal States
  const [termOutput, setTermOutput] = useState<string[]>([
    '--- Connected to dashboard.ictevents.space ---',
    'Type a command or tap a quick action below.',
  ]);
  const [termInput, setTermInput] = useState('');
  const [termSending, setTermSending] = useState(false);

  // Alerts States
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [testingAlert, setTestingAlert] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const termScrollRef = useRef<ScrollView | null>(null);

  // Theme Colors Palette
  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    headerBg: isDark ? '#090d16' : '#ffffff',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    textMuted: '#64748b',
    inputBg: isDark ? '#020617' : '#f1f5f9',
    inputBorder: isDark ? '#334155' : '#cbd5e1',
    navBg: isDark ? '#090d16fa' : '#fffffff2',
    navBorder: isDark ? '#1e293b' : '#e2e8f0',
    barTrack: isDark ? '#1e293b' : '#e2e8f0',
    actionCardBorder: isDark ? '#1e293b' : '#cbd5e1',
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. AUTHENTICATION
  const handleLogin = async () => {
    if (!password) {
      Alert.alert('Password Required', 'Please enter your administrator password.');
      return;
    }
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        connectWebSocket(data.token);
      } else {
        Alert.alert('Authentication Failed', data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message || 'Cannot reach server host');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2. WEBSOCKET REALTIME STREAM
  const connectWebSocket = (authToken: string) => {
    try {
      const wsUrl = serverUrl.replace(/^http/, 'ws') + `/ws/metrics?token=${encodeURIComponent(authToken)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telemetry') {
            const data: ServerMetrics = payload.data;
            setMetrics(data);
            setMetricsHistory((prev) => {
              const next = [...prev, { cpu: data.cpu.usagePercent, mem: data.memory.percentUsed }];
              return next.slice(-20);
            });
          }
        } catch (e) {}
      };

      ws.onerror = (e) => {
        console.log('Mobile WS Error:', e);
      };
    } catch (err) {
      console.log('Failed to connect WS:', err);
    }
  };

  // 3. FETCH PROCESSES
  const fetchProcesses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${serverUrl}/api/system/processes?limit=60`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch (e) {}
  };

  // 4. FETCH ALERTS
  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const [resConf, resEvents] = await Promise.all([
        fetch(`${serverUrl}/api/alerts/config`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${serverUrl}/api/alerts/events`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resConf.ok) setAlertConfig(await resConf.json());
      if (resEvents.ok) setAlertEvents(await resEvents.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'processes') {
      fetchProcesses();
      const interval = setInterval(fetchProcesses, 3500);
      return () => clearInterval(interval);
    }
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [token, activeTab]);

  // 5. EMERGENCY ACTIONS
  const runEmergencyAction = async (action: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/system/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.output || 'Action executed');
    } catch (e: any) {
      Alert.alert('Action Failed', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. KILL PROCESS
  const killProcess = (pid: number, name: string) => {
    Alert.alert('Terminate Process', `Send SIGTERM to ${name} (PID: ${pid})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Terminate',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${serverUrl}/api/system/processes/kill`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ pid, signal: 'SIGTERM' }),
            });
            const data = await res.json();
            Alert.alert(data.success ? 'Terminated' : 'Failed', data.message);
            fetchProcesses();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // 7. TERMINAL EXECUTION
  const sendCommand = async (cmdToSend?: string) => {
    const cmd = cmdToSend || termInput.trim();
    if (!cmd || !token) return;
    setTermInput('');
    setTermSending(true);
    setTermOutput((prev) => [...prev, `$ ${cmd}`]);

    try {
      const res = await fetch(`${serverUrl}/api/system/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'custom', customCommand: cmd }),
      });
      const data = await res.json();
      setTermOutput((prev) => [...prev, data.output || 'Executed']);
    } catch (err: any) {
      setTermOutput((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setTermSending(false);
      setTimeout(() => termScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // 8. TEST ALERT DISPATCH
  const sendTestAlert = async () => {
    if (!token) return;
    setTestingAlert(true);
    try {
      const res = await fetch(`${serverUrl}/api/alerts/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: 'Test alert dispatched from Mobile App (Server Commander).',
        }),
      });
      const data = await res.json();
      Alert.alert(data.sent ? 'Email Dispatched!' : 'Notice', data.message);
      fetchAlerts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTestingAlert(false);
    }
  };

  // HELPERS
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  // RENDER: LOGIN SCREEN
  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.loginCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>SERVER COMMANDER</Text>
          <Text style={styles.serverSubtitle}>dashboard.ictevents.space</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Server Host</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter admin password"
              placeholderTextColor="#64748b"
            />
          </View>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleLogin}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#020617" />
            ) : (
              <Text style={styles.buttonPrimaryText}>CONNECT & UNLOCK →</Text>
            )}
          </TouchableOpacity>

          {/* Theme Toggle on Login Screen */}
          <TouchableOpacity
            style={[styles.themeToggleBtn, { borderColor: colors.inputBorder }]}
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filtered & Sorted Processes
  const filteredProcesses = processes
    .filter(
      (p) =>
        p.name.toLowerCase().includes(processSearch.toLowerCase()) ||
        p.pid.toString().includes(processSearch) ||
        p.user.toLowerCase().includes(processSearch.toLowerCase())
    )
    .sort((a, b) => (sortBy === 'cpu' ? b.cpu - a.cpu : b.mem - a.mem));

  const primaryDisk = metrics?.disks && metrics.disks.length > 0 ? metrics.disks[0] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Modern Host Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderColor: colors.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.liveDot} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>168.144.134.223</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>ONLINE</Text>
            </View>
          </View>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {metrics
              ? `${metrics.system.hostname} • ${metrics.system.distro} • Uptime: ${formatUptime(metrics.system.uptime)}`
              : 'Connecting telemetry...'}
          </Text>
        </View>

        {/* Header Action Buttons: Theme Toggle & Logout */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeHeaderBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }]}
            title="Toggle Theme"
          >
            <Text style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (wsRef.current) wsRef.current.close();
              setToken(null);
            }}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* TAB 1: TELEMETRY & OVERVIEW */}
        {activeTab === 'telemetry' && (
          <View style={{ paddingBottom: 90 }}>
            {/* Live History Bar Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>LIVE ACTIVITY (PAST 30s)</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: 'bold' }}>■ CPU %</Text>
                  <Text style={{ color: '#a855f7', fontSize: 10, fontWeight: 'bold' }}>■ RAM %</Text>
                </View>
              </View>
              <View style={[styles.sparklineContainer, { borderColor: colors.cardBorder }]}>
                {metricsHistory.map((item, idx) => (
                  <View key={idx} style={styles.sparklineCol}>
                    <View
                      style={[
                        styles.sparklineBar,
                        {
                          height: `${Math.max(4, item.cpu)}%`,
                          backgroundColor: item.cpu > 80 ? '#ef4444' : '#22c55e',
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.sparklineBar,
                        {
                          height: `${Math.max(4, item.mem)}%`,
                          backgroundColor: '#a855f7',
                          marginTop: 2,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* 4 Metric Cards */}
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>CPU UTILIZATION</Text>
                <Text style={[styles.statTag, { color: colors.textMuted }]}>1 vCPU Core</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{metrics?.cpu.usagePercent || 0}%</Text>
              <View style={[styles.progressBar, { backgroundColor: colors.barTrack }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, metrics?.cpu.usagePercent || 0)}%`,
                      backgroundColor: (metrics?.cpu.usagePercent || 0) > 80 ? '#ef4444' : '#22c55e',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>MEMORY (RAM)</Text>
                <Text style={[styles.statTag, { color: colors.textMuted }]}>
                  Swap: {metrics?.memory.swapPercentUsed || 0}% ({formatBytes(metrics?.memory.swapUsed || 0)})
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{metrics?.memory.percentUsed || 0}%</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>
                {formatBytes(metrics?.memory.used || 0)} / {formatBytes(metrics?.memory.total || 0)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.barTrack }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, metrics?.memory.percentUsed || 0)}%`,
                      backgroundColor: '#a855f7',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>STORAGE ({primaryDisk?.mount || '/'})</Text>
                <Text style={[styles.statTag, { color: colors.textMuted }]}>NVMe / SSD</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{primaryDisk?.usePercent || 0}%</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>
                {formatBytes(primaryDisk?.used || 0)} / {formatBytes(primaryDisk?.size || 0)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.barTrack }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, primaryDisk?.usePercent || 0)}%`,
                      backgroundColor: (primaryDisk?.usePercent || 0) > 80 ? '#ef4444' : '#0ea5e9',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NETWORK THROUGHPUT</Text>
                <Text style={[styles.statTag, { color: colors.textMuted }]}>{metrics?.network.interface || 'eth0'}</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatBytes(metrics?.network.rxSec || 0)}/s</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>
                Upload: {formatBytes(metrics?.network.txSec || 0)}/s • Total Rx: {formatBytes(metrics?.network.rxTotal || 0)}
              </Text>
            </View>
          </View>
        )}

        {/* TAB 2: PROCESSES */}
        {activeTab === 'processes' && (
          <View style={{ paddingBottom: 90 }}>
            {/* Search & Sort Bar */}
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                placeholder="Search PID, name, user..."
                placeholderTextColor="#64748b"
                value={processSearch}
                onChangeText={setProcessSearch}
              />
              <TouchableOpacity
                style={[styles.sortBtn, { backgroundColor: colors.cardBg, borderColor: sortBy === 'cpu' ? '#22c55e' : colors.cardBorder }]}
                onPress={() => setSortBy(sortBy === 'cpu' ? 'mem' : 'cpu')}
              >
                <Text style={styles.sortBtnText}>Sort: {sortBy.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {filteredProcesses.map((p) => (
              <View key={p.pid} style={[styles.procCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.procName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.procMeta, { color: colors.textMuted }]}>
                    PID {p.pid} • User: {p.user}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 14 }}>
                  <Text style={styles.procCpu}>CPU: {p.cpu}%</Text>
                  <Text style={styles.procMem}>RAM: {p.mem}%</Text>
                </View>
                <TouchableOpacity onPress={() => killProcess(p.pid, p.name)} style={styles.killBtn}>
                  <Text style={styles.killText}>KILL</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: INTERACTIVE TERMINAL */}
        {activeTab === 'terminal' && (
          <View style={{ paddingBottom: 90 }}>
            <View style={[styles.termCard, { backgroundColor: isDark ? '#090d16' : '#ffffff', borderColor: colors.cardBorder }]}>
              <View style={styles.termHeader}>
                <Text style={[styles.termTitle, { color: colors.textSecondary }]}>REMOTE SHELL CONSOLE</Text>
                <TouchableOpacity onPress={() => setTermOutput(['--- Terminal Cleared ---'])}>
                  <Text style={styles.clearBtnText}>CLEAR</Text>
                </TouchableOpacity>
              </View>

              {/* Console logs */}
              <ScrollView ref={termScrollRef} style={styles.termConsole} nestedScrollEnabled>
                {termOutput.map((line, idx) => (
                  <Text key={idx} style={styles.termText}>
                    {line}
                  </Text>
                ))}
              </ScrollView>

              {/* Quick shortcut chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {['uptime', 'free -h', 'df -h', 'ps aux --sort=-%cpu | head -n 8', 'systemctl status caddy'].map(
                  (cmd) => (
                    <TouchableOpacity
                      key={cmd}
                      style={[styles.chip, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: colors.cardBorder }]}
                      onPress={() => sendCommand(cmd)}
                      disabled={termSending}
                    >
                      <Text style={[styles.chipText, { color: isDark ? '#94a3b8' : '#334155' }]}>{cmd}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {/* Command Input Bar */}
              <View style={styles.termInputRow}>
                <Text style={styles.promptSymbol}>$</Text>
                <TextInput
                  style={[styles.termInput, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Type shell command..."
                  placeholderTextColor="#64748b"
                  value={termInput}
                  onChangeText={setTermInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={() => sendCommand()}
                />
                <TouchableOpacity
                  style={styles.termSendBtn}
                  onPress={() => sendCommand()}
                  disabled={termSending}
                >
                  {termSending ? (
                    <ActivityIndicator size="small" color="#020617" />
                  ) : (
                    <Text style={styles.termSendText}>RUN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: ALERTS & RESEND */}
        {activeTab === 'alerts' && (
          <View style={{ paddingBottom: 90 }}>
            <View style={[styles.alertCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Resend Email Alerts</Text>
              <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                Recipient: {alertConfig?.emailRecipient || 'itkindom.dhomes@gmail.com'}
              </Text>
              <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                Thresholds: CPU {alertConfig?.cpuThreshold || 90}% • RAM {alertConfig?.memThreshold || 90}%
              </Text>

              <TouchableOpacity
                style={styles.testAlertBtn}
                onPress={sendTestAlert}
                disabled={testingAlert}
              >
                {testingAlert ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text style={styles.testAlertBtnText}>✉️ SEND TEST ALERT EMAIL</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>INCIDENT & ALERT LOGS</Text>
            {alertEvents.length === 0 ? (
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>
                  No alerts triggered. Server is nominal.
                </Text>
              </View>
            ) : (
              alertEvents.map((ev) => (
                <View key={ev.id} style={[styles.eventCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[styles.eventType, { color: colors.textSecondary }]}>{ev.type}</Text>
                    <Text
                      style={[
                        styles.eventSeverity,
                        { color: ev.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' },
                      ]}
                    >
                      {ev.severity}
                    </Text>
                  </View>
                  <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{ev.title}</Text>
                  <Text style={[styles.eventMsg, { color: colors.textMuted }]}>{ev.message}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 5: QUICK ACTIONS */}
        {activeTab === 'actions' && (
          <View style={{ paddingBottom: 90, gap: 14 }}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.actionCardBorder }]}
              onPress={() => runEmergencyAction('clear_cache')}
              disabled={actionLoading}
            >
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Drop PageCache (Free RAM)</Text>
              <Text style={[styles.actionDesc, { color: colors.textMuted }]}>Flushes inactive Linux kernel pagecache buffer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.actionCardBorder }]}
              onPress={() => runEmergencyAction('restart_caddy')}
              disabled={actionLoading}
            >
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Reload Caddy Web Server</Text>
              <Text style={[styles.actionDesc, { color: colors.textMuted }]}>Restarts reverse proxy & renews SSL if needed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: '#ef4444' }]}
              onPress={() => {
                Alert.alert('Reboot Server', 'Are you sure you want to reboot the VPS?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Schedule Reboot',
                    style: 'destructive',
                    onPress: () => runEmergencyAction('reboot'),
                  },
                ]);
              }}
              disabled={actionLoading}
            >
              <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Reboot Server</Text>
              <Text style={[styles.actionDesc, { color: colors.textMuted }]}>Gracefully restarts host machine in 60 seconds</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modern Bottom Tab Bar */}
      <View style={[styles.bottomNav, { backgroundColor: colors.navBg, borderColor: colors.navBorder }]}>
        {[
          { id: 'telemetry', label: 'Stats', icon: '📊' },
          { id: 'processes', label: 'Tasks', icon: '⚙️' },
          { id: 'terminal', label: 'Shell', icon: '💻' },
          { id: 'alerts', label: 'Alerts', icon: '🔔' },
          { id: 'actions', label: 'Actions', icon: '⚡' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === tab.id ? styles.navLabelActive : { color: colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 15, fontFamily: 'monospace' },
  badgePill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#15803d',
  },
  badgePillText: { color: '#4ade80', fontSize: 9, fontWeight: 'bold' },
  headerSub: { fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  themeHeaderBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#ef444420', borderRadius: 8, borderWidth: 1, borderColor: '#ef444440' },
  logoutText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 18, paddingTop: 16 },

  // Live Chart Card
  chartCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  chartTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  sparklineContainer: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  sparklineCol: { width: 10, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  sparklineBar: { width: 4, borderRadius: 2 },

  // Metric Cards
  statCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  statTag: { fontSize: 11, fontFamily: 'monospace' },
  statValue: { fontSize: 26, fontWeight: 'bold', marginVertical: 4, fontFamily: 'monospace' },
  statSub: { fontSize: 11, fontFamily: 'monospace' },
  progressBar: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Processes Tab
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
  },
  sortBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 12,
  },
  sortBtnText: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  procCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  procName: { fontWeight: 'bold', fontSize: 13 },
  procMeta: { fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  procCpu: { color: '#22c55e', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' },
  procMem: { color: '#a855f7', fontSize: 11, fontFamily: 'monospace' },
  killBtn: {
    backgroundColor: '#ef444422',
    borderWidth: 1,
    borderColor: '#ef444466',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  killText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  // Terminal Tab
  termCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  termHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  termTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  clearBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  termConsole: {
    height: 280,
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  termText: { color: '#22c55e', fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },
  chipsRow: { marginTop: 10, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontFamily: 'monospace' },
  termInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promptSymbol: { color: '#22c55e', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  termInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  termSendBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  termSendText: { color: '#020617', fontWeight: 'bold', fontSize: 11 },

  // Alerts Tab
  alertCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  alertTitle: { fontSize: 15, fontWeight: 'bold' },
  alertDesc: { fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
  testAlertBtn: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  testAlertBtnText: { color: '#020617', fontWeight: 'bold', fontSize: 12 },
  sectionHeader: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  eventCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  eventType: { fontSize: 11, fontWeight: 'bold' },
  eventSeverity: { fontSize: 10, fontWeight: 'bold' },
  eventTitle: { fontSize: 13, fontWeight: 'bold', marginVertical: 2 },
  eventMsg: { fontSize: 11 },

  // Actions Tab
  actionCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionTitle: { fontWeight: 'bold', fontSize: 14 },
  actionDesc: { fontSize: 12, marginTop: 4 },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, marginTop: 2 },
  navLabelActive: { color: '#22c55e', fontWeight: 'bold' },

  // Login Screen
  loginCard: {
    margin: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 50,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 24 },
  appTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1.5 },
  serverSubtitle: { fontSize: 12, color: '#22c55e', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
  },
  buttonPrimary: { backgroundColor: '#22c55e', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonPrimaryText: { color: '#020617', fontWeight: 'bold', fontSize: 13 },
  themeToggleBtn: { marginTop: 14, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});

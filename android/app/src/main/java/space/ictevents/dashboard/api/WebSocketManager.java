package space.ictevents.dashboard.api;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.google.gson.Gson;

import java.net.URLEncoder;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import space.ictevents.dashboard.models.ServerMetrics;
import space.ictevents.dashboard.models.TelemetryMessage;
import space.ictevents.dashboard.utils.SessionManager;

public class WebSocketManager {
    private static final String TAG = "WebSocketManager";

    public interface TelemetryListener {
        void onMetricsReceived(ServerMetrics metrics);
        void onConnectionChanged(boolean connected);
    }

    private static WebSocketManager instance;
    private final Context appContext;
    private final OkHttpClient client;
    private final Gson gson;
    private final Handler mainHandler;
    private final CopyOnWriteArrayList<TelemetryListener> listeners = new CopyOnWriteArrayList<>();

    private WebSocket webSocket;
    private boolean isConnecting = false;
    private boolean isConnected = false;
    private boolean shouldReconnect = true;
    private boolean isPollingActive = false;

    private final Runnable restPollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!shouldReconnect) return;
            if (!isConnected) {
                fetchRestMetrics();
                mainHandler.postDelayed(this, 2000);
            }
        }
    };

    private WebSocketManager(Context context) {
        this.appContext = context.getApplicationContext();
        this.gson = new Gson();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.client = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .pingInterval(10, TimeUnit.SECONDS)
                .build();
    }

    public static synchronized WebSocketManager getInstance(Context context) {
        if (instance == null) {
            instance = new WebSocketManager(context);
        }
        return instance;
    }

    public void addListener(TelemetryListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
        listener.onConnectionChanged(isConnected);
    }

    public void removeListener(TelemetryListener listener) {
        listeners.remove(listener);
    }

    public synchronized void connect() {
        shouldReconnect = true;

        // Start fallback REST polling immediately so stats populate instantly
        startRestFallback();

        if (isConnecting || isConnected) return;

        SessionManager session = SessionManager.getInstance(appContext);
        String token = session.getToken();
        String serverUrl = session.getServerUrl();

        if (token == null || token.trim().isEmpty()) {
            Log.w(TAG, "Cannot connect: No auth token present");
            return;
        }

        if (serverUrl == null || serverUrl.trim().isEmpty()) {
            serverUrl = SessionManager.DEFAULT_SERVER_URL;
        }
        serverUrl = serverUrl.trim();
        if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
            serverUrl = "https://" + serverUrl;
        }

        isConnecting = true;

        try {
            String wsUrl = serverUrl.replace("https://", "wss://").replace("http://", "ws://");
            if (wsUrl.endsWith("/")) {
                wsUrl = wsUrl.substring(0, wsUrl.length() - 1);
            }
            wsUrl += "/ws/metrics?token=" + URLEncoder.encode(token, "UTF-8");

            Request request = new Request.Builder()
                    .url(wsUrl)
                    .build();

            webSocket = client.newWebSocket(request, new WebSocketListener() {
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    isConnecting = false;
                    isConnected = true;
                    stopRestFallback();
                    Log.d(TAG, "WebSocket connected successfully");
                    notifyConnectionChanged(true);
                }

                @Override
                public void onMessage(WebSocket webSocket, String text) {
                    try {
                        TelemetryMessage msg = gson.fromJson(text, TelemetryMessage.class);
                        if (msg != null && msg.getData() != null) {
                            notifyMetrics(msg.getData());
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error deserializing metrics: " + e.getMessage());
                    }
                }

                @Override
                public void onClosed(WebSocket webSocket, int code, String reason) {
                    isConnected = false;
                    isConnecting = false;
                    notifyConnectionChanged(false);
                    startRestFallback();
                    scheduleReconnect();
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    isConnected = false;
                    isConnecting = false;
                    Log.e(TAG, "WebSocket failure: " + t.getMessage());
                    notifyConnectionChanged(false);
                    startRestFallback();
                    scheduleReconnect();
                }
            });
        } catch (Throwable t) {
            isConnecting = false;
            isConnected = false;
            Log.e(TAG, "Failed to start websocket: " + t.getMessage());
            startRestFallback();
            scheduleReconnect();
        }
    }

    private void fetchRestMetrics() {
        ApiClient.getInstance(appContext).getMetrics(new ApiClient.ApiCallback<ServerMetrics>() {
            @Override
            public void onSuccess(ServerMetrics result) {
                if (result != null) {
                    notifyMetrics(result);
                }
            }

            @Override
            public void onError(String errorMessage) {
                Log.w(TAG, "REST metrics error: " + errorMessage);
            }
        });
    }

    private void startRestFallback() {
        if (!isPollingActive) {
            isPollingActive = true;
            fetchRestMetrics();
            mainHandler.postDelayed(restPollRunnable, 2000);
        }
    }

    private void stopRestFallback() {
        isPollingActive = false;
        mainHandler.removeCallbacks(restPollRunnable);
    }

    private void scheduleReconnect() {
        if (!shouldReconnect) return;
        mainHandler.postDelayed(() -> {
            if (shouldReconnect && !isConnected && !isConnecting) {
                connect();
            }
        }, 3000);
    }

    public synchronized void disconnect() {
        shouldReconnect = false;
        stopRestFallback();
        if (webSocket != null) {
            webSocket.close(1000, "App paused or logged out");
            webSocket = null;
        }
        isConnected = false;
        isConnecting = false;
        notifyConnectionChanged(false);
    }

    private void notifyConnectionChanged(boolean connected) {
        mainHandler.post(() -> {
            for (TelemetryListener listener : listeners) {
                listener.onConnectionChanged(connected);
            }
        });
    }

    private void notifyMetrics(ServerMetrics metrics) {
        mainHandler.post(() -> {
            for (TelemetryListener listener : listeners) {
                listener.onMetricsReceived(metrics);
            }
        });
    }
}

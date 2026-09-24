package space.ictevents.dashboard.api;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import space.ictevents.dashboard.utils.SessionManager;

public class TerminalWebSocketManager {
    public interface TerminalListener {
        void onOutput(String text);
        void onConnected();
        void onDisconnected();
    }

    private final Context appContext;
    private final OkHttpClient client;
    private final Gson gson;
    private final Handler mainHandler;
    private WebSocket webSocket;
    private TerminalListener listener;

    private static final Pattern ANSI_PATTERN = Pattern.compile("\\x1B\\[[0-9;]*[a-zA-Z]");

    public TerminalWebSocketManager(Context context) {
        this.appContext = context.getApplicationContext();
        this.gson = new Gson();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.client = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .pingInterval(10, TimeUnit.SECONDS)
                .build();
    }

    public void setListener(TerminalListener listener) {
        this.listener = listener;
    }

    public void connect() {
        SessionManager session = SessionManager.getInstance(appContext);
        String token = session.getToken();
        String serverUrl = session.getServerUrl();

        if (token == null || token.isEmpty()) return;

        String wsUrl = serverUrl.replace("https://", "wss://").replace("http://", "ws://");
        if (wsUrl.endsWith("/")) {
            wsUrl = wsUrl.substring(0, wsUrl.length() - 1);
        }
        wsUrl += "/ws/terminal?token=" + token;

        Request request = new Request.Builder().url(wsUrl).build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                if (listener != null) {
                    mainHandler.post(() -> listener.onConnected());
                }
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                String clean = stripAnsi(text);
                try {
                    JsonObject obj = gson.fromJson(text, JsonObject.class);
                    if (obj != null && obj.has("data")) {
                        clean = stripAnsi(obj.get("data").getAsString());
                    }
                } catch (Exception ignored) {
                }

                final String out = clean;
                if (listener != null) {
                    mainHandler.post(() -> listener.onOutput(out));
                }
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                if (listener != null) {
                    mainHandler.post(() -> listener.onDisconnected());
                }
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                if (listener != null) {
                    mainHandler.post(() -> {
                        listener.onOutput("\n[Terminal disconnected: " + t.getMessage() + "]\n");
                        listener.onDisconnected();
                    });
                }
            }
        });
    }

    public void sendInput(String input) {
        if (webSocket != null) {
            JsonObject obj = new JsonObject();
            obj.addProperty("type", "stdin");
            obj.addProperty("data", input);
            webSocket.send(obj.toString());
        }
    }

    public void disconnect() {
        if (webSocket != null) {
            webSocket.close(1000, "User left terminal");
            webSocket = null;
        }
    }

    private String stripAnsi(String text) {
        if (text == null) return "";
        return ANSI_PATTERN.matcher(text).replaceAll("");
    }
}

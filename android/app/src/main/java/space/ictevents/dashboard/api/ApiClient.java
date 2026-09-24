package space.ictevents.dashboard.api;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import space.ictevents.dashboard.models.AlertConfig;
import space.ictevents.dashboard.models.AlertEvent;
import space.ictevents.dashboard.models.LoginRequest;
import space.ictevents.dashboard.models.LoginResponse;
import space.ictevents.dashboard.models.ProcessItem;
import space.ictevents.dashboard.models.ServerMetrics;
import space.ictevents.dashboard.utils.SessionManager;

public class ApiClient {
    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String errorMessage);
    }

    private static ApiClient instance;
    private final OkHttpClient client;
    private final Gson gson;
    private final Handler mainHandler;
    private final Context appContext;

    private ApiClient(Context context) {
        this.appContext = context.getApplicationContext();
        this.gson = new Gson();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.client = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .writeTimeout(20, TimeUnit.SECONDS)
                .build();
    }

    public static synchronized ApiClient getInstance(Context context) {
        if (instance == null) {
            instance = new ApiClient(context);
        }
        return instance;
    }

    public Gson getGson() {
        return gson;
    }

    public OkHttpClient getOkHttpClient() {
        return client;
    }

    private String getBaseUrl() {
        SessionManager session = SessionManager.getInstance(appContext);
        String url = session.getServerUrl();
        if (url == null || url.trim().isEmpty()) {
            url = SessionManager.DEFAULT_SERVER_URL;
        }
        url = url.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    private Request.Builder newAuthenticatedRequest(String path) {
        String token = SessionManager.getInstance(appContext).getToken();
        Request.Builder builder = new Request.Builder()
                .url(getBaseUrl() + path)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json");

        if (token != null && !token.isEmpty()) {
            builder.addHeader("Authorization", "Bearer " + token);
        }
        return builder;
    }

    public void login(String serverUrl, String username, String password, ApiCallback<LoginResponse> callback) {
        if (serverUrl == null || serverUrl.trim().isEmpty()) {
            serverUrl = SessionManager.DEFAULT_SERVER_URL;
        }
        serverUrl = serverUrl.trim();
        if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
            serverUrl = "https://" + serverUrl;
        }
        if (serverUrl.endsWith("/")) {
            serverUrl = serverUrl.substring(0, serverUrl.length() - 1);
        }
        String jsonBody = gson.toJson(new LoginRequest(username, password));
        RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(serverUrl + "/api/auth/login")
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Connection failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String resStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        LoginResponse loginRes = gson.fromJson(resStr, LoginResponse.class);
                        postSuccess(callback, loginRes);
                    } catch (Exception ex) {
                        postError(callback, "Invalid response from server");
                    }
                } else {
                    postError(callback, "Authentication failed (HTTP " + response.code() + ")");
                }
            }
        });
    }

    public void getMetrics(ApiCallback<ServerMetrics> callback) {
        Request request = newAuthenticatedRequest("/api/system/metrics")
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Network error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String bodyStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        ServerMetrics metrics = gson.fromJson(bodyStr, ServerMetrics.class);
                        postSuccess(callback, metrics);
                    } catch (Exception e) {
                        postError(callback, "Failed to parse metrics: " + e.getMessage());
                    }
                } else {
                    postError(callback, "Server returned " + response.code());
                }
            }
        });
    }

    public void getProcesses(ApiCallback<List<ProcessItem>> callback) {
        Request request = newAuthenticatedRequest("/api/system/processes?limit=100")
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Network error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String bodyStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        Type listType = new TypeToken<List<ProcessItem>>(){}.getType();
                        List<ProcessItem> list = gson.fromJson(bodyStr, listType);
                        postSuccess(callback, list);
                    } catch (Exception e) {
                        postError(callback, "Failed to parse process list");
                    }
                } else {
                    postError(callback, "Server returned " + response.code());
                }
            }
        });
    }

    public void killProcess(int pid, ApiCallback<Boolean> callback) {
        JsonObject json = new JsonObject();
        json.addProperty("pid", pid);
        json.addProperty("signal", "SIGTERM");

        RequestBody body = RequestBody.create(json.toString(), MediaType.parse("application/json; charset=utf-8"));
        Request request = newAuthenticatedRequest("/api/system/processes/kill")
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Network error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    postSuccess(callback, true);
                } else {
                    postError(callback, "Failed to terminate process (HTTP " + response.code() + ")");
                }
            }
        });
    }

    public void executeAction(String action, ApiCallback<String> callback) {
        executeAction(action, null, callback);
    }

    public void executeAction(String action, String target, ApiCallback<String> callback) {
        JsonObject json = new JsonObject();
        json.addProperty("action", action);
        if (target != null && !target.isEmpty()) {
            json.addProperty("target", target);
        }

        RequestBody body = RequestBody.create(json.toString(), MediaType.parse("application/json; charset=utf-8"));
        Request request = newAuthenticatedRequest("/api/system/actions")
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Action failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String bodyStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        JsonObject obj = gson.fromJson(bodyStr, JsonObject.class);
                        String output = obj.has("output") ? obj.get("output").getAsString() : "Success";
                        postSuccess(callback, output);
                    } catch (Exception e) {
                        postSuccess(callback, "Success: " + bodyStr);
                    }
                } else {
                    postError(callback, "Action execution error (HTTP " + response.code() + ")");
                }
            }
        });
    }

    public void getAlertConfig(ApiCallback<AlertConfig> callback) {
        Request request = newAuthenticatedRequest("/api/alerts/config")
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Error fetching alerts: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String bodyStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        AlertConfig config = gson.fromJson(bodyStr, AlertConfig.class);
                        postSuccess(callback, config);
                    } catch (Exception e) {
                        postError(callback, "Failed to parse alert configuration");
                    }
                } else {
                    postError(callback, "Server returned " + response.code());
                }
            }
        });
    }

    public void getAlertEvents(ApiCallback<List<AlertEvent>> callback) {
        Request request = newAuthenticatedRequest("/api/alerts/events?limit=50")
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Error fetching events: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String bodyStr = response.body() != null ? response.body().string() : "";
                if (response.isSuccessful()) {
                    try {
                        Type listType = new TypeToken<List<AlertEvent>>(){}.getType();
                        List<AlertEvent> events = gson.fromJson(bodyStr, listType);
                        postSuccess(callback, events);
                    } catch (Exception e) {
                        postError(callback, "Failed to parse alert events");
                    }
                } else {
                    postError(callback, "Server returned " + response.code());
                }
            }
        });
    }

    public void sendTestAlert(ApiCallback<Boolean> callback) {
        JsonObject json = new JsonObject();
        json.addProperty("message", "Manual test alert dispatched from Android Server Commander app.");

        RequestBody body = RequestBody.create(json.toString(), MediaType.parse("application/json; charset=utf-8"));
        Request request = newAuthenticatedRequest("/api/alerts/test")
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                postError(callback, "Network error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    postSuccess(callback, true);
                } else {
                    postError(callback, "Test alert failed (HTTP " + response.code() + ")");
                }
            }
        });
    }

    private <T> void postSuccess(ApiCallback<T> callback, T result) {
        if (callback != null) {
            mainHandler.post(() -> callback.onSuccess(result));
        }
    }

    private <T> void postError(ApiCallback<T> callback, String msg) {
        if (callback != null) {
            mainHandler.post(() -> callback.onError(msg));
        }
    }
}

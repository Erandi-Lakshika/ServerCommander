package space.ictevents.dashboard.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {
    private static final String PREF_NAME = "server_commander_prefs";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String KEY_USERNAME = "username";
    private static final String KEY_DARK_MODE = "dark_mode";

    public static final String DEFAULT_SERVER_URL = "https://dashboard.ictevents.space";
    public static final String DEFAULT_USERNAME = "admin";

    private final SharedPreferences prefs;
    private static SessionManager instance;

    public SessionManager(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized SessionManager getInstance(Context context) {
        if (instance == null) {
            instance = new SessionManager(context);
        }
        return instance;
    }

    public void saveSession(String token, String serverUrl, String username) {
        prefs.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_SERVER_URL, serverUrl)
                .putString(KEY_USERNAME, username)
                .apply();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public boolean isLoggedIn() {
        String token = getToken();
        return token != null && !token.trim().isEmpty();
    }

    public String getServerUrl() {
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
    }

    public void setServerUrl(String url) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply();
    }

    public String getUsername() {
        return prefs.getString(KEY_USERNAME, DEFAULT_USERNAME);
    }

    public boolean isDarkMode() {
        return prefs.getBoolean(KEY_DARK_MODE, true); // Dark mode default
    }

    public void setDarkMode(boolean enabled) {
        prefs.edit().putBoolean(KEY_DARK_MODE, enabled).apply();
    }

    public void clearSession() {
        prefs.edit().remove(KEY_TOKEN).apply();
    }
}

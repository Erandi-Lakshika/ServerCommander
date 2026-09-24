package space.ictevents.dashboard.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

import com.google.android.material.button.MaterialButton;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.api.ApiClient;
import space.ictevents.dashboard.models.LoginResponse;
import space.ictevents.dashboard.utils.SessionManager;

public class LoginActivity extends AppCompatActivity {

    private EditText etServerUrl;
    private EditText etUsername;
    private EditText etPassword;
    private MaterialButton btnLogin;
    private MaterialButton btnToggleTheme;
    private ProgressBar pbLoading;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        sessionManager = SessionManager.getInstance(this);

        // Apply saved theme
        if (sessionManager.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        super.onCreate(savedInstanceState);

        // If user already authenticated, proceed directly to MainActivity
        if (sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_login);

        etServerUrl = findViewById(R.id.et_server_url);
        etUsername = findViewById(R.id.et_username);
        etPassword = findViewById(R.id.et_password);
        btnLogin = findViewById(R.id.btn_login);
        btnToggleTheme = findViewById(R.id.btn_toggle_theme);
        pbLoading = findViewById(R.id.pb_login_loading);

        etServerUrl.setText(sessionManager.getServerUrl());
        etUsername.setText(sessionManager.getUsername());

        btnLogin.setOnClickListener(v -> performLogin());

        btnToggleTheme.setOnClickListener(v -> {
            boolean currentDark = sessionManager.isDarkMode();
            sessionManager.setDarkMode(!currentDark);
            if (!currentDark) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            }
        });
    }

    private void performLogin() {
        String serverUrl = etServerUrl.getText().toString().trim();
        String username = etUsername.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (serverUrl.isEmpty()) {
            etServerUrl.setError("Server URL is required");
            return;
        }
        if (username.isEmpty()) {
            etUsername.setError("Username is required");
            return;
        }
        if (password.isEmpty()) {
            etPassword.setError("Password is required");
            return;
        }

        btnLogin.setEnabled(false);
        pbLoading.setVisibility(View.VISIBLE);

        ApiClient.getInstance(this).login(serverUrl, username, password, new ApiClient.ApiCallback<LoginResponse>() {
            @Override
            public void onSuccess(LoginResponse result) {
                btnLogin.setEnabled(true);
                pbLoading.setVisibility(View.GONE);

                if (result != null && result.getToken() != null && !result.getToken().isEmpty()) {
                    sessionManager.saveSession(result.getToken(), serverUrl, username);
                    Toast.makeText(LoginActivity.this, "Welcome, " + username + "!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                    finish();
                } else {
                    String error = (result != null && result.getError() != null) ? result.getError() : "Login failed";
                    Toast.makeText(LoginActivity.this, error, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onError(String errorMessage) {
                btnLogin.setEnabled(true);
                pbLoading.setVisibility(View.GONE);
                Toast.makeText(LoginActivity.this, errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }
}

package space.ictevents.dashboard.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.api.WebSocketManager;
import space.ictevents.dashboard.models.ServerMetrics;
import space.ictevents.dashboard.models.SystemInfo;
import space.ictevents.dashboard.utils.FormatUtils;
import space.ictevents.dashboard.utils.SessionManager;

public class MainActivity extends AppCompatActivity implements WebSocketManager.TelemetryListener {

    private TextView tvHeaderIp;
    private TextView tvHeaderSub;
    private ImageButton btnTheme;
    private ImageButton btnLogout;
    private BottomNavigationView bottomNav;
    private SessionManager sessionManager;
    private WebSocketManager wsManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        sessionManager = SessionManager.getInstance(this);

        // Enforce saved theme
        if (sessionManager.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        super.onCreate(savedInstanceState);

        // Security check
        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);

        tvHeaderIp = findViewById(R.id.tv_header_ip);
        tvHeaderSub = findViewById(R.id.tv_header_sub);
        btnTheme = findViewById(R.id.btn_header_theme);
        btnLogout = findViewById(R.id.btn_header_logout);
        bottomNav = findViewById(R.id.bottom_nav);

        // Update Theme button icon according to mode
        btnTheme.setImageResource(sessionManager.isDarkMode() ? R.drawable.ic_sun : R.drawable.ic_moon);

        btnTheme.setOnClickListener(v -> {
            boolean dark = sessionManager.isDarkMode();
            sessionManager.setDarkMode(!dark);
            AppCompatDelegate.setDefaultNightMode(!dark ? AppCompatDelegate.MODE_NIGHT_YES : AppCompatDelegate.MODE_NIGHT_NO);
        });

        btnLogout.setOnClickListener(v -> {
            wsManager.disconnect();
            sessionManager.clearSession();
            startActivity(new Intent(MainActivity.this, LoginActivity.class));
            finish();
        });

        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            Fragment selectedFragment = null;

            if (itemId == R.id.nav_stats) {
                selectedFragment = new TelemetryFragment();
            } else if (itemId == R.id.nav_processes) {
                selectedFragment = new ProcessesFragment();
            } else if (itemId == R.id.nav_terminal) {
                selectedFragment = new TerminalFragment();
            } else if (itemId == R.id.nav_alerts) {
                selectedFragment = new AlertsFragment();
            } else if (itemId == R.id.nav_actions) {
                selectedFragment = new ActionsFragment();
            }

            if (selectedFragment != null) {
                getSupportFragmentManager().beginTransaction()
                        .replace(R.id.fragment_container, selectedFragment)
                        .commit();
                return true;
            }
            return false;
        });

        // Set default fragment
        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.fragment_container, new TelemetryFragment())
                    .commit();
        }

        // Start real-time metrics telemetry
        wsManager = WebSocketManager.getInstance(this);
        wsManager.addListener(this);
        wsManager.connect();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (wsManager != null) {
            wsManager.connect();
        }
    }

    @Override
    public void onMetricsReceived(ServerMetrics metrics) {
        if (metrics != null && metrics.getSystem() != null) {
            SystemInfo sys = metrics.getSystem();
            tvHeaderIp.setText(sys.getHostname() + " (" + sys.getDistro() + ")");
            tvHeaderSub.setText("Uptime: " + FormatUtils.formatUptime(sys.getUptime()) + " • Node: " + sys.getNodeVersion());
        }
    }

    @Override
    public void onConnectionChanged(boolean connected) {
        if (connected) {
            tvHeaderSub.setText("Connected • Live Telemetry");
        } else {
            tvHeaderSub.setText("Telemetry: Live (REST)");
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (wsManager != null) {
            wsManager.removeListener(this);
        }
    }
}

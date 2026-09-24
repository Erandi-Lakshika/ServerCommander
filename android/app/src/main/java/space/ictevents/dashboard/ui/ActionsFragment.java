package space.ictevents.dashboard.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.api.ApiClient;

public class ActionsFragment extends Fragment {

    private MaterialButton btnDropCache;
    private MaterialButton btnReloadCaddy;
    private MaterialButton btnRestartPm2;
    private MaterialButton btnRebootServer;
    private TextView tvActionOutput;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_actions, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        btnDropCache = view.findViewById(R.id.btnDropCache);
        btnReloadCaddy = view.findViewById(R.id.btnReloadCaddy);
        btnRestartPm2 = view.findViewById(R.id.btnRestartPm2);
        btnRebootServer = view.findViewById(R.id.btnRebootServer);
        tvActionOutput = view.findViewById(R.id.tvActionOutput);

        btnDropCache.setOnClickListener(v -> runAction("clear_cache", null, "Dropping memory pagecache..."));
        btnReloadCaddy.setOnClickListener(v -> runAction("restart_caddy", null, "Reloading Caddy reverse proxy..."));
        
        btnRestartPm2.setOnClickListener(v -> {
            String[] options = new String[] {
                "⚡ All PM2 Services (Global Reload)",
                "🚀 server-dashboard (#0)"
            };
            new AlertDialog.Builder(requireContext())
                    .setTitle("Select PM2 Service to Restart")
                    .setItems(options, (dialog, which) -> {
                        String target = (which == 0) ? "all" : "server-dashboard";
                        runAction("restart_pm2", target, "Reloading PM2 service: " + target + "...");
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });

        btnRebootServer.setOnClickListener(v -> {
            new AlertDialog.Builder(requireContext())
                    .setTitle("Danger: Reboot Server")
                    .setMessage("This will initiate a full reboot of host 168.144.134.223. All running services will temporarily go offline. Do you wish to continue?")
                    .setIcon(R.drawable.ic_warning)
                    .setPositiveButton("Reboot Now", (dialog, which) -> {
                        runAction("reboot", null, "Dispatching reboot command to Linux kernel...");
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
    }

    private void runAction(String actionKey, @Nullable String target, String initialMessage) {
        tvActionOutput.setText("[Executing]\n" + initialMessage + "\n");
        ApiClient.getInstance(requireContext()).executeAction(actionKey, target, new ApiClient.ApiCallback<String>() {
            @Override
            public void onSuccess(String result) {
                if (!isAdded()) return;
                tvActionOutput.setText("[Success]\n" + result + "\n[Finished at " + new java.util.Date() + "]");
                Toast.makeText(requireContext(), "Action completed successfully", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onError(String errorMessage) {
                if (!isAdded()) return;
                tvActionOutput.setText("[Failed]\n" + errorMessage);
                Toast.makeText(requireContext(), "Execution failed: " + errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }
}

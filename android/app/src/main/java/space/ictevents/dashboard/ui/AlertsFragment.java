package space.ictevents.dashboard.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.button.MaterialButton;

import java.util.List;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.adapters.AlertAdapter;
import space.ictevents.dashboard.api.ApiClient;
import space.ictevents.dashboard.models.AlertConfig;
import space.ictevents.dashboard.models.AlertEvent;

public class AlertsFragment extends Fragment {

    private SwipeRefreshLayout swipeRefresh;
    private TextView tvStatusBadge;
    private TextView tvRecipientEmail;
    private MaterialButton btnSendTest;
    private ProgressBar pbSendingTest;

    private TextView tvCpuThreshold;
    private TextView tvRamThreshold;
    private TextView tvDiskThreshold;

    private RecyclerView rvAlertHistory;
    private TextView tvNoAlerts;
    private AlertAdapter alertAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_alerts, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        swipeRefresh = view.findViewById(R.id.swipeRefreshAlerts);
        tvStatusBadge = view.findViewById(R.id.tvAlertStatusBadge);
        tvRecipientEmail = view.findViewById(R.id.tvRecipientEmail);
        btnSendTest = view.findViewById(R.id.btnSendTestAlert);
        pbSendingTest = view.findViewById(R.id.pbSendingTest);

        tvCpuThreshold = view.findViewById(R.id.tvCpuThreshold);
        tvRamThreshold = view.findViewById(R.id.tvRamThreshold);
        tvDiskThreshold = view.findViewById(R.id.tvDiskThreshold);

        rvAlertHistory = view.findViewById(R.id.rvAlertHistory);
        tvNoAlerts = view.findViewById(R.id.tvNoAlerts);

        alertAdapter = new AlertAdapter();
        rvAlertHistory.setLayoutManager(new LinearLayoutManager(requireContext()));
        rvAlertHistory.setAdapter(alertAdapter);

        swipeRefresh.setOnRefreshListener(this::loadData);

        btnSendTest.setOnClickListener(v -> dispatchTestAlert());

        loadData();
    }

    private void loadData() {
        if (!isAdded()) return;

        // 1. Fetch Config
        ApiClient.getInstance(requireContext()).getAlertConfig(new ApiClient.ApiCallback<AlertConfig>() {
            @Override
            public void onSuccess(AlertConfig config) {
                if (!isAdded() || config == null) return;
                tvRecipientEmail.setText(config.getEmailRecipient());
                tvStatusBadge.setText(config.isEnabled() ? "ACTIVE" : "PAUSED");

                tvCpuThreshold.setText("> " + (int) config.getCpuThreshold() + "%");
                tvRamThreshold.setText("> " + (int) config.getMemThreshold() + "%");
                tvDiskThreshold.setText("> " + (int) config.getDiskThreshold() + "%");
            }

            @Override
            public void onError(String errorMessage) {
                // Silently fallback to defaults
            }
        });

        // 2. Fetch Events
        ApiClient.getInstance(requireContext()).getAlertEvents(new ApiClient.ApiCallback<List<AlertEvent>>() {
            @Override
            public void onSuccess(List<AlertEvent> events) {
                if (!isAdded()) return;
                swipeRefresh.setRefreshing(false);
                alertAdapter.setEvents(events);
                tvNoAlerts.setVisibility((events == null || events.isEmpty()) ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(String errorMessage) {
                if (!isAdded()) return;
                swipeRefresh.setRefreshing(false);
                Toast.makeText(requireContext(), "Alerts error: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void dispatchTestAlert() {
        btnSendTest.setEnabled(false);
        pbSendingTest.setVisibility(View.VISIBLE);

        ApiClient.getInstance(requireContext()).sendTestAlert(new ApiClient.ApiCallback<Boolean>() {
            @Override
            public void onSuccess(Boolean result) {
                if (!isAdded()) return;
                btnSendTest.setEnabled(true);
                pbSendingTest.setVisibility(View.GONE);
                Toast.makeText(requireContext(), "Test alert email dispatched successfully!", Toast.LENGTH_LONG).show();
                loadData();
            }

            @Override
            public void onError(String errorMessage) {
                if (!isAdded()) return;
                btnSendTest.setEnabled(true);
                pbSendingTest.setVisibility(View.GONE);
                Toast.makeText(requireContext(), "Failed to send alert: " + errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }
}

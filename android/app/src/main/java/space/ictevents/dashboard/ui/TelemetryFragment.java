package space.ictevents.dashboard.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import java.util.List;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.api.ApiClient;
import space.ictevents.dashboard.api.WebSocketManager;
import space.ictevents.dashboard.models.CpuMetrics;
import space.ictevents.dashboard.models.DiskMetrics;
import space.ictevents.dashboard.models.MemoryMetrics;
import space.ictevents.dashboard.models.NetworkMetrics;
import space.ictevents.dashboard.models.ServerMetrics;
import space.ictevents.dashboard.utils.FormatUtils;

public class TelemetryFragment extends Fragment implements WebSocketManager.TelemetryListener {

    private TextView tvCpuBrand;
    private TextView tvCpuVal;
    private ProgressBar pbCpu;

    private TextView tvSwapVal;
    private TextView tvRamVal;
    private TextView tvRamSub;
    private ProgressBar pbRam;

    private TextView tvDiskTitle;
    private TextView tvDiskVal;
    private TextView tvDiskSub;
    private ProgressBar pbDisk;

    private TextView tvNetIface;
    private TextView tvNetVal;
    private TextView tvNetSub;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_telemetry, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        tvCpuBrand = view.findViewById(R.id.tv_cpu_brand);
        tvCpuVal = view.findViewById(R.id.tv_cpu_val);
        pbCpu = view.findViewById(R.id.pb_cpu);

        tvSwapVal = view.findViewById(R.id.tv_swap_val);
        tvRamVal = view.findViewById(R.id.tv_ram_val);
        tvRamSub = view.findViewById(R.id.tv_ram_sub);
        pbRam = view.findViewById(R.id.pb_ram);

        tvDiskTitle = view.findViewById(R.id.tv_disk_title);
        tvDiskVal = view.findViewById(R.id.tv_disk_val);
        tvDiskSub = view.findViewById(R.id.tv_disk_sub);
        pbDisk = view.findViewById(R.id.pb_disk);

        tvNetIface = view.findViewById(R.id.tv_net_iface);
        tvNetVal = view.findViewById(R.id.tv_net_val);
        tvNetSub = view.findViewById(R.id.tv_net_sub);

        // 1. Immediately request current metrics over REST so values show instantly
        ApiClient.getInstance(requireContext()).getMetrics(new ApiClient.ApiCallback<ServerMetrics>() {
            @Override
            public void onSuccess(ServerMetrics result) {
                if (isAdded() && result != null) {
                    onMetricsReceived(result);
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Handled gracefully by WebSocketManager
            }
        });

        // 2. Register for continuous real-time updates
        WebSocketManager.getInstance(requireContext()).addListener(this);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (getContext() != null) {
            WebSocketManager.getInstance(getContext()).removeListener(this);
        }
    }

    @Override
    public void onMetricsReceived(ServerMetrics metrics) {
        if (!isAdded() || metrics == null) return;

        // CPU
        CpuMetrics cpu = metrics.getCpu();
        if (cpu != null) {
            double usage = cpu.getUsagePercent();
            tvCpuVal.setText(FormatUtils.formatPercent(usage));
            pbCpu.setProgress((int) Math.round(usage));
            int cores = cpu.getCores() != null ? cpu.getCores().size() : 1;
            tvCpuBrand.setText(cores + " vCPU Cores");
        }

        // Memory & Swap
        MemoryMetrics mem = metrics.getMemory();
        if (mem != null) {
            double memUsage = mem.getPercentUsed();
            tvRamVal.setText(FormatUtils.formatPercent(memUsage));
            pbRam.setProgress((int) Math.round(memUsage));
            tvRamSub.setText(FormatUtils.formatBytes(mem.getUsed()) + " / " + FormatUtils.formatBytes(mem.getTotal()));

            double swapUsage = mem.getSwapPercentUsed();
            tvSwapVal.setText("Swap: " + FormatUtils.formatPercent(swapUsage) + " (" + FormatUtils.formatBytes(mem.getSwapUsed()) + ")");
        }

        // Disk
        List<DiskMetrics> disks = metrics.getDisks();
        if (disks != null && !disks.isEmpty()) {
            DiskMetrics rootDisk = disks.get(0);
            tvDiskTitle.setText("STORAGE (" + rootDisk.getMount() + ")");
            tvDiskVal.setText(FormatUtils.formatPercent(rootDisk.getUsePercent()));
            pbDisk.setProgress((int) Math.round(rootDisk.getUsePercent()));
            tvDiskSub.setText(FormatUtils.formatBytes(rootDisk.getUsed()) + " / " + FormatUtils.formatBytes(rootDisk.getSize()));
        }

        // Network
        NetworkMetrics net = metrics.getNetwork();
        if (net != null) {
            tvNetIface.setText(net.getInterface());
            tvNetVal.setText("↓ " + FormatUtils.formatRate(net.getRxSec()));
            tvNetSub.setText("↑ " + FormatUtils.formatRate(net.getTxSec()) + " • Total: " + FormatUtils.formatBytes((long) net.getRxTotal()));
        }
    }

    @Override
    public void onConnectionChanged(boolean connected) {
        // MainActivity handles the global indicator
    }
}

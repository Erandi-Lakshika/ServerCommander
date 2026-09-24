package space.ictevents.dashboard.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.models.ProcessItem;
import space.ictevents.dashboard.utils.FormatUtils;

public class ProcessAdapter extends RecyclerView.Adapter<ProcessAdapter.ProcessViewHolder> {

    public interface OnProcessKillListener {
        void onKillRequested(ProcessItem item);
    }

    private final List<ProcessItem> originalList = new ArrayList<>();
    private final List<ProcessItem> filteredList = new ArrayList<>();
    private final OnProcessKillListener killListener;

    public ProcessAdapter(OnProcessKillListener killListener) {
        this.killListener = killListener;
    }

    public void setProcesses(List<ProcessItem> processes) {
        originalList.clear();
        if (processes != null) {
            originalList.addAll(processes);
        }
        filter("");
    }

    public void filter(String query) {
        filteredList.clear();
        if (query == null || query.trim().isEmpty()) {
            filteredList.addAll(originalList);
        } else {
            String q = query.toLowerCase(Locale.US).trim();
            for (ProcessItem p : originalList) {
                if (String.valueOf(p.getPid()).contains(q) ||
                    p.getName().toLowerCase(Locale.US).contains(q) ||
                    p.getUser().toLowerCase(Locale.US).contains(q) ||
                    p.getCommand().toLowerCase(Locale.US).contains(q)) {
                    filteredList.add(p);
                }
            }
        }
        notifyDataSetChanged();
    }

    public void sortByCpu() {
        Collections.sort(filteredList, (a, b) -> Double.compare(b.getCpu(), a.getCpu()));
        notifyDataSetChanged();
    }

    public void sortByMem() {
        Collections.sort(filteredList, (a, b) -> Double.compare(b.getMem(), a.getMem()));
        notifyDataSetChanged();
    }

    public void sortByPid() {
        Collections.sort(filteredList, (a, b) -> Integer.compare(a.getPid(), b.getPid()));
        notifyDataSetChanged();
    }

    public int getFilteredCount() {
        return filteredList.size();
    }

    @NonNull
    @Override
    public ProcessViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_process, parent, false);
        return new ProcessViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ProcessViewHolder holder, int position) {
        ProcessItem item = filteredList.get(position);
        holder.tvPid.setText(String.valueOf(item.getPid()));
        holder.tvUser.setText(item.getUser());
        holder.tvCpu.setText(FormatUtils.formatPercent(item.getCpu()) + " CPU");
        holder.tvMem.setText(FormatUtils.formatPercent(item.getMem()) + " RAM");
        holder.tvCommand.setText(item.getCommand());

        holder.btnKill.setOnClickListener(v -> {
            if (killListener != null) {
                killListener.onKillRequested(item);
            }
        });
    }

    @Override
    public int getItemCount() {
        return filteredList.size();
    }

    static class ProcessViewHolder extends RecyclerView.ViewHolder {
        final TextView tvPid;
        final TextView tvUser;
        final TextView tvCpu;
        final TextView tvMem;
        final TextView tvCommand;
        final ImageButton btnKill;

        public ProcessViewHolder(@NonNull View itemView) {
            super(itemView);
            tvPid = itemView.findViewById(R.id.tvProcessPid);
            tvUser = itemView.findViewById(R.id.tvProcessUser);
            tvCpu = itemView.findViewById(R.id.tvProcessCpu);
            tvMem = itemView.findViewById(R.id.tvProcessMem);
            tvCommand = itemView.findViewById(R.id.tvProcessCommand);
            btnKill = itemView.findViewById(R.id.btnKillProcess);
        }
    }
}

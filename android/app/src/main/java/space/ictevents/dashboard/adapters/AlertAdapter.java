package space.ictevents.dashboard.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.models.AlertEvent;
import space.ictevents.dashboard.utils.FormatUtils;

public class AlertAdapter extends RecyclerView.Adapter<AlertAdapter.AlertViewHolder> {

    private final List<AlertEvent> events = new ArrayList<>();

    public void setEvents(List<AlertEvent> newEvents) {
        events.clear();
        if (newEvents != null) {
            events.addAll(newEvents);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public AlertViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_alert, parent, false);
        return new AlertViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AlertViewHolder holder, int position) {
        AlertEvent item = events.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvMessage.setText(item.getMessage());
        holder.tvTimestamp.setText(FormatUtils.formatTimestamp(item.getTimestamp()));

        String severity = item.getSeverity().toUpperCase();
        holder.tvBadge.setText(severity);

        if ("CRITICAL".equals(severity)) {
            holder.tvBadge.setTextColor(Color.parseColor("#EF4444"));
        } else if ("WARNING".equals(severity)) {
            holder.tvBadge.setTextColor(Color.parseColor("#F59E0B"));
        } else {
            holder.tvBadge.setTextColor(Color.parseColor("#0EA5E9"));
        }
    }

    @Override
    public int getItemCount() {
        return events.size();
    }

    static class AlertViewHolder extends RecyclerView.ViewHolder {
        final TextView tvBadge;
        final TextView tvTitle;
        final TextView tvTimestamp;
        final TextView tvMessage;

        public AlertViewHolder(@NonNull View itemView) {
            super(itemView);
            tvBadge = itemView.findViewById(R.id.tvAlertLevelBadge);
            tvTitle = itemView.findViewById(R.id.tvAlertTitle);
            tvTimestamp = itemView.findViewById(R.id.tvAlertTimestamp);
            tvMessage = itemView.findViewById(R.id.tvAlertMessage);
        }
    }
}

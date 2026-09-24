package space.ictevents.dashboard.utils;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FormatUtils {

    public static String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return String.format(Locale.US, "%.1f %s", bytes / Math.pow(1024, digitGroups), units[digitGroups]);
    }

    public static String formatRate(double bytesPerSec) {
        if (bytesPerSec <= 0) return "0 B/s";
        final String[] units = new String[]{"B/s", "KB/s", "MB/s", "GB/s"};
        int digitGroups = (int) (Math.log10(bytesPerSec) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return String.format(Locale.US, "%.1f %s", bytesPerSec / Math.pow(1024, digitGroups), units[digitGroups]);
    }

    public static String formatUptime(double seconds) {
        long sec = (long) seconds;
        long days = sec / 86400;
        long hours = (sec % 86400) / 3600;
        long minutes = (sec % 3600) / 60;
        long s = sec % 60;

        if (days > 0) {
            return String.format(Locale.US, "%dd %dh %dm", days, hours, minutes);
        } else if (hours > 0) {
            return String.format(Locale.US, "%dh %dm %ds", hours, minutes, s);
        } else {
            return String.format(Locale.US, "%dm %ds", minutes, s);
        }
    }

    public static String formatPercent(double val) {
        return String.format(Locale.US, "%.1f%%", val);
    }

    public static String formatTimestamp(long timestamp) {
        if (timestamp <= 0) return "Just now";
        SimpleDateFormat sdf = new SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault());
        return sdf.format(new Date(timestamp));
    }
}

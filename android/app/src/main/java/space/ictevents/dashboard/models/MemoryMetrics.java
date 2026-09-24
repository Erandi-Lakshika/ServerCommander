package space.ictevents.dashboard.models;

public class MemoryMetrics {
    private long total;
    private long used;
    private long free;
    private long available;
    private double percentUsed;
    private long swapTotal;
    private long swapUsed;
    private long swapFree;
    private double swapPercentUsed;

    public long getTotal() { return total; }
    public long getUsed() { return used; }
    public long getFree() { return free; }
    public long getAvailable() { return available; }
    public double getPercentUsed() { return percentUsed; }
    public long getSwapTotal() { return swapTotal; }
    public long getSwapUsed() { return swapUsed; }
    public long getSwapFree() { return swapFree; }
    public double getSwapPercentUsed() { return swapPercentUsed; }
}

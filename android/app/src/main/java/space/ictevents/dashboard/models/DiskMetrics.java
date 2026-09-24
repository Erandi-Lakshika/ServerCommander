package space.ictevents.dashboard.models;

public class DiskMetrics {
    private String fs;
    private String type;
    private long size;
    private long used;
    private long available;
    private double usePercent;
    private String mount;

    public String getFs() { return fs; }
    public String getType() { return type; }
    public long getSize() { return size; }
    public long getUsed() { return used; }
    public long getAvailable() { return available; }
    public double getUsePercent() { return usePercent; }
    public String getMount() { return mount != null ? mount : "/"; }
}

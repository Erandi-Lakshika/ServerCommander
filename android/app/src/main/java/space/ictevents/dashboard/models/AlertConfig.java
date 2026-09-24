package space.ictevents.dashboard.models;

public class AlertConfig {
    private String emailRecipient;
    private double cpuThreshold;
    private double memThreshold;
    private double diskThreshold;
    private boolean enabled;

    public String getEmailRecipient() { return emailRecipient != null ? emailRecipient : "itkindom.dhomes@gmail.com"; }
    public double getCpuThreshold() { return cpuThreshold > 0 ? cpuThreshold : 90.0; }
    public double getMemThreshold() { return memThreshold > 0 ? memThreshold : 90.0; }
    public double getDiskThreshold() { return diskThreshold > 0 ? diskThreshold : 90.0; }
    public boolean isEnabled() { return enabled; }
}

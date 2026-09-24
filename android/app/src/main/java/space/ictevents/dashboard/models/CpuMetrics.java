package space.ictevents.dashboard.models;

import java.util.List;

public class CpuMetrics {
    private double usagePercent;
    private List<Double> cores;
    private List<Double> loadAvg;
    private String brand;
    private double speed;
    private Double temperature;

    public double getUsagePercent() { return usagePercent; }
    public List<Double> getCores() { return cores; }
    public List<Double> getLoadAvg() { return loadAvg; }
    public String getBrand() { return brand != null ? brand : "Unknown CPU"; }
    public double getSpeed() { return speed; }
    public Double getTemperature() { return temperature; }
}

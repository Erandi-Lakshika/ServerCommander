package space.ictevents.dashboard.models;

import java.util.List;

public class ServerMetrics {
    private long timestamp;
    private SystemInfo system;
    private CpuMetrics cpu;
    private MemoryMetrics memory;
    private List<DiskMetrics> disks;
    private NetworkMetrics network;

    public long getTimestamp() { return timestamp; }
    public SystemInfo getSystem() { return system; }
    public CpuMetrics getCpu() { return cpu; }
    public MemoryMetrics getMemory() { return memory; }
    public List<DiskMetrics> getDisks() { return disks; }
    public NetworkMetrics getNetwork() { return network; }
}

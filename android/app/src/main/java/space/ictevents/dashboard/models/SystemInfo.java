package space.ictevents.dashboard.models;

public class SystemInfo {
    private String hostname;
    private String platform;
    private String distro;
    private String release;
    private double uptime;
    private String arch;
    private String nodeVersion;

    public String getHostname() { return hostname != null ? hostname : "server"; }
    public String getPlatform() { return platform != null ? platform : "linux"; }
    public String getDistro() { return distro != null ? distro : "Linux"; }
    public String getRelease() { return release != null ? release : ""; }
    public double getUptime() { return uptime; }
    public String getArch() { return arch != null ? arch : "x64"; }
    public String getNodeVersion() { return nodeVersion != null ? nodeVersion : ""; }
}

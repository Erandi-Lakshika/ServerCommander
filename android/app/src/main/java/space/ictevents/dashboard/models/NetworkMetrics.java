package space.ictevents.dashboard.models;

import com.google.gson.annotations.SerializedName;

public class NetworkMetrics {
    @SerializedName("interface")
    private String iface;
    private double rxSec;
    private double txSec;
    private double rxTotal;
    private double txTotal;

    public String getInterface() { return iface != null ? iface : "eth0"; }
    public double getRxSec() { return rxSec; }
    public double getTxSec() { return txSec; }
    public double getRxTotal() { return rxTotal; }
    public double getTxTotal() { return txTotal; }
}

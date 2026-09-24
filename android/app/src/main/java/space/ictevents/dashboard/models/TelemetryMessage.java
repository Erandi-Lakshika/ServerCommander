package space.ictevents.dashboard.models;

public class TelemetryMessage {
    private String type;
    private ServerMetrics data;

    public String getType() { return type; }
    public ServerMetrics getData() { return data; }
}

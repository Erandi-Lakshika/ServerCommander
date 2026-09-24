package space.ictevents.dashboard.models;

public class AlertEvent {
    private String id;
    private long timestamp;
    private String type;
    private String severity;
    private String title;
    private String message;
    private boolean resolved;

    public String getId() { return id != null ? id : ""; }
    public long getTimestamp() { return timestamp; }
    public String getType() { return type != null ? type : "SYSTEM"; }
    public String getSeverity() { return severity != null ? severity : "INFO"; }
    public String getTitle() { return title != null ? title : "System Notification"; }
    public String getMessage() { return message != null ? message : ""; }
    public boolean isResolved() { return resolved; }
}

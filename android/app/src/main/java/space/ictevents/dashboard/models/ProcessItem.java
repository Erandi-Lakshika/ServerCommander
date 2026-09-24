package space.ictevents.dashboard.models;

public class ProcessItem {
    private int pid;
    private String name;
    private double cpu;
    private double mem;
    private String user;
    private String command;
    private int priority;

    public int getPid() { return pid; }
    public String getName() { return name != null ? name : "process"; }
    public double getCpu() { return cpu; }
    public double getMem() { return mem; }
    public String getUser() { return user != null ? user : "root"; }
    public String getCommand() { return command != null ? command : name; }
    public int getPriority() { return priority; }
}

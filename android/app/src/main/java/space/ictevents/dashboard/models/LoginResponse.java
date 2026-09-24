package space.ictevents.dashboard.models;

public class LoginResponse {
    private boolean success;
    private String token;
    private String error;
    private UserInfo user;

    public boolean isSuccess() { return success; }
    public String getToken() { return token; }
    public String getError() { return error; }
    public UserInfo getUser() { return user; }

    public static class UserInfo {
        private String id;
        private String username;
        private String role;

        public String getId() { return id; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
    }
}

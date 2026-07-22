package quantran.api.model;
import quantran.api.entity.UserEntity;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;


public class UserModel {
    @NotNull (message = "UserName is required!")
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9]{7,14}$", message = "Invalid UserName")
    private String userName;
    @NotNull (message = "Password is required!")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*\\d)[a-zA-Z0-9]{5,20}$", message = "Invalid Password")
    private String password;
    @NotNull(message = "User role is required")
    @NotEmpty(message = "User role is required")
    private String userRole;

    private String key;
    public UserModel() {}
    public UserModel(UserEntity userEntity) {
        this.userName = userEntity.getUserName();
        this.password = userEntity.getPassword();
        this.userRole = userEntity.getUserRole().getUserRole();
    }
    public UserModel(String userName, String password, String userRole, String key) {
        this.userName = userName;
        this.password = password;
        this.userRole = userRole;
        this.key = key;
    }
    public UserModel(String userName, String password, String userRole) {
        this.userName = userName;
        this.password = password;
        this.userRole = userRole;
        this.key = "";
    }
    public UserModel(String userName, String key) {
        this.userName = userName;
        this.key = key;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getUserRole() {
        if ("customer".equals(userRole)) {
            return 1;
        }
        if ("seller".equals(userRole)) {
            return 2;
        }
        return 3; // admin
    }
    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

}

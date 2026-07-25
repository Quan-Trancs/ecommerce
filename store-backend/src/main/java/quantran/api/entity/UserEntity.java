package quantran.api.entity;



import quantran.api.UserRole.UserRole;
import quantran.api.model.UserModel;

import javax.persistence.*;

@Entity
@Table(name = "user2")
public class UserEntity {

    @Id
    @Column(name = "userName")
    private String userName;
    @Column(name = "password")
    private String password;

    @ManyToOne()
    @JoinColumn(name = "roleId", referencedColumnName = "roleId")
    private UserRole userRole;

    @Column(name = "key")
    private String key;

    public UserEntity() {}
    public UserEntity(String userName, String password, UserRole userRole) {
        this.userName = userName;
        this.password = password;
        this.userRole = userRole;
    }
    public UserEntity(UserModel userModel) {
        this.userName = userModel.getUserName();
        this.password = userModel.getPassword();
        UserRole newUserRole = new UserRole(userModel.getUserRole());
        this.userRole = newUserRole;
        this.key = userModel.getKey();
    }
    public UserEntity(String userName, String password, int userRole) {
        this.userName = userName;
        this.password = password;
        this.userRole = new UserRole(userRole);
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

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }

    public String getKey() { return key;}

    public void setKey(String key) { this.key = key; }

}

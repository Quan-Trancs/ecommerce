package quantran.api.UserRole;

import quantran.api.entity.UserEntity;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "userRole")
public class UserRole {
    @Id
    @Column(name = "roleName")
    private String roleName;
    @Column(name = "roleId")
    private int roleId;

    @OneToMany(mappedBy = "userRole")
    private List<UserEntity> userEntities;

    public UserRole() {}
    public UserRole(int roleId) {
        this.roleId = roleId;
    }
    public String getUserRole() {
        return this.roleName;
    }

    public void setUserRole(int roleId) {
        this.roleId = roleId;
    }
}

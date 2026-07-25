package quantran.api.business;

import quantran.api.entity.UserEntity;

public interface UserBusiness {
    String login(UserEntity userEntity, String key);
}

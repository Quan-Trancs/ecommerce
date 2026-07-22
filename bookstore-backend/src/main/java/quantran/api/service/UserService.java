package quantran.api.service;

import quantran.api.entity.UserEntity;
import quantran.api.model.UserModel;

public interface UserService {
    String login(UserModel userModel);

    String generateUserKey(UserEntity userEntity);
}

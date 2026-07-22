package quantran.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import quantran.api.business.UserBusiness;
import quantran.api.entity.UserEntity;
import quantran.api.model.UserModel;
import quantran.api.service.UserService;
import quantran.api.util.RandomUtil;

@Service
@Log4j2
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserBusiness userBusiness;

    @Override
    public String generateUserKey(UserEntity userEntity) {
        return RandomUtil.generateSecureRandomString(10);
    }
    
    @Override
    public String login(UserModel userModel) {
        log.info("Start login()");
        UserEntity userEntity = new UserEntity(userModel);
        String key = generateUserKey(userEntity);
        key = userBusiness.login(userEntity, key);
        return key;
    }
}

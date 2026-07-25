package quantran.api.business.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import quantran.api.business.UserBusiness;
import quantran.api.entity.UserEntity;
import quantran.api.repository.UserRepository;
import quantran.api.util.PasswordUtil;

@Service
@Log4j2
@RequiredArgsConstructor
public class UserBusinessImpl implements UserBusiness {
    private final UserRepository userRepository;
    @Override
    public String login(UserEntity userEntity, String newKey) {
        log.info("Start login()");
        String userName = userEntity.getUserName();
        String password = userEntity.getPassword();
        
        // Get existing user entity to check credentials
        UserEntity existingUserEntity = userRepository.findByUserName(userName);
        
        if (existingUserEntity != null) {
            // Verify password using hashed password
            String storedPassword = existingUserEntity.getPassword();
            boolean passwordValid = PasswordUtil.verifyPassword(password, storedPassword);
            
            if (passwordValid) {
                String userKey = existingUserEntity.getKey();
                
                // If user already has a key, use it; otherwise, set the new key
                if (userKey != null && !userKey.isEmpty()) {
                    return userKey;
                } else {
                    // Update the existing user with the new key
                    existingUserEntity.setKey(newKey);
                    userRepository.save(existingUserEntity);
                    return newKey;
                }
            } else {
                log.warn("Invalid password for user: {}", userName);
                return null;
            }
        } else {
            log.warn("User not found: {}", userName);
            return null;
        }
    }
}

package quantran.api.asyncProcessingWorkAcceptor.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import quantran.api.asyncProcessingWorkAcceptor.AsyncProcessingWorkAcceptor;
import quantran.api.model.UserModel;
import quantran.api.repository.UserRepository;
import quantran.api.entity.UserEntity;

@Component
@Log4j2
@RequiredArgsConstructor
public class AsyncProcessingWorkAcceptorImpl implements AsyncProcessingWorkAcceptor {
    
    private final UserRepository userRepository;
    
    @Override
    public String[] acceptWork(UserModel userModel) {
        String[] requestStatus = new String[2];
        String userName = userModel.getUserName();
        
        if (userName == null || userName.trim().isEmpty()) {
            requestStatus[0] = "400";
            requestStatus[1] = "Bad Request: Username is required";
            return requestStatus;
        }

        String key = userModel.getKey();
        if (key == null || key.trim().isEmpty()) {
            requestStatus[0] = "400";
            requestStatus[1] = "Bad Request: User key is required";
            return requestStatus;
        }

        // Perform authorization checks with the key value
        try {
            UserEntity userEntity = userRepository.findByUserName(userName);
            if (userEntity == null) {
                requestStatus[0] = "404";
                requestStatus[1] = "Not Found: User not found";
                return requestStatus;
            }
            
            // Verify the user key matches (in a real implementation, this would be a proper token validation)
            if (!key.equals(userEntity.getKey())) {
                requestStatus[0] = "401";
                requestStatus[1] = "Unauthorized: Invalid user key";
                return requestStatus;
            }
            
            String requestId = java.util.UUID.randomUUID().toString();
            requestStatus[0] = "200"; // Success
            requestStatus[1] = requestId;
            log.info("Authorization successful for user: {}", userName);
            return requestStatus;
            
        } catch (Exception e) {
            log.error("Error during authorization for user: {}", userName, e);
            requestStatus[0] = "500";
            requestStatus[1] = "Internal server error during authorization";
            return requestStatus;
        }
    }
}
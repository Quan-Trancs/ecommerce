package quantran.api.service;

import quantran.api.dto.LoginRequestDto;
import quantran.api.dto.LoginResponseDto;
import quantran.api.model.UserModel;

public interface AuthService {
    /**
     * Authenticate user and generate JWT token
     */
    LoginResponseDto login(LoginRequestDto loginRequest);
    
    /**
     * Validate user credentials
     */
    boolean validateUser(String username, String password);
    
    /**
     * Get user by username
     */
    UserModel getUserByUsername(String username);
    
    /**
     * Refresh JWT token
     */
    LoginResponseDto refreshToken(String refreshToken);
} 
package quantran.api.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class PasswordUtil {
    
    /**
     * Generate a salt for password hashing
     */
    public static String generateSalt() {
        byte[] salt = RandomUtil.generateSecureRandomBytes(16);
        return Base64.getEncoder().encodeToString(salt);
    }
    
    /**
     * Hash a password with salt using SHA-256
     */
    public static String hashPassword(String password, String salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt.getBytes());
            byte[] hashedPassword = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hashedPassword);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    /**
     * Verify a password against a hashed password
     */
    public static boolean verifyPassword(String password, String hashedPassword, String salt) {
        String newHash = hashPassword(password, salt);
        return newHash.equals(hashedPassword);
    }
    
    /**
     * Hash a password with a new salt
     */
    public static String hashPassword(String password) {
        String salt = generateSalt();
        return hashPassword(password, salt) + ":" + salt;
    }
    
    /**
     * Verify a password against a stored hash (includes salt)
     */
    public static boolean verifyPassword(String password, String storedHash) {
        String[] parts = storedHash.split(":");
        if (parts.length != 2) {
            return false;
        }
        String hashedPassword = parts[0];
        String salt = parts[1];
        return verifyPassword(password, hashedPassword, salt);
    }
} 
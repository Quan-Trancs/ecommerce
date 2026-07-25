package quantran.api.util;

import java.security.SecureRandom;
import java.util.Random;

/**
 * Utility class for random number generation
 * Provides both SecureRandom (for security-sensitive operations) and Random (for general use)
 */
public class RandomUtil {
    
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Random RANDOM = new Random();
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    /**
     * Generate a random string of specified length using SecureRandom
     * @param length Length of the string to generate
     * @return Random string
     */
    public static String generateSecureRandomString(int length) {
        StringBuilder result = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int randomIndex = SECURE_RANDOM.nextInt(CHARACTERS.length());
            result.append(CHARACTERS.charAt(randomIndex));
        }
        return result.toString();
    }
    
    /**
     * Generate random bytes using SecureRandom
     * @param length Number of bytes to generate
     * @return Array of random bytes
     */
    public static byte[] generateSecureRandomBytes(int length) {
        byte[] bytes = new byte[length];
        SECURE_RANDOM.nextBytes(bytes);
        return bytes;
    }
    
    /**
     * Get SecureRandom instance for direct use
     * @return SecureRandom instance
     */
    public static SecureRandom getSecureRandom() {
        return SECURE_RANDOM;
    }
    
    /**
     * Get Random instance for general use
     * @return Random instance
     */
    public static Random getRandom() {
        return RANDOM;
    }
    
    /**
     * Generate a random integer between 0 (inclusive) and bound (exclusive) using Random
     * @param bound Upper bound (exclusive)
     * @return Random integer
     */
    public static int nextInt(int bound) {
        return RANDOM.nextInt(bound);
    }
    
    /**
     * Generate a random double between 0.0 and 1.0 using Random
     * @return Random double
     */
    public static double nextDouble() {
        return RANDOM.nextDouble();
    }
} 
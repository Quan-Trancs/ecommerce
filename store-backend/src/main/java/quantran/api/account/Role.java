package quantran.api.account;

import java.util.Locale;

public enum Role {
    BUYER,
    SELLER,
    SUPPORT,
    ADMIN;

    public static Role from(String value) {
        if (value == null || value.trim().isEmpty()) {
            return BUYER;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if ("USER".equals(normalized) || "CUSTOMER".equals(normalized)) {
            return BUYER;
        }
        if ("CS".equals(normalized) || "CUSTOMER_SERVICE".equals(normalized)) {
            return SUPPORT;
        }
        if ("MODERATOR".equals(normalized)) {
            return ADMIN;
        }
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return BUYER;
        }
    }

    public boolean canSell() {
        return this == SELLER || this == ADMIN;
    }

    /** View any order / assist buyers without full admin powers. */
    public boolean canAssist() {
        return this == SUPPORT || this == ADMIN;
    }

    public boolean isAdmin() {
        return this == ADMIN;
    }
}

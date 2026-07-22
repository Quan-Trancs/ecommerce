package quantran.api.common;

public class UrlConstant {
    
    // Resource-based constants (new standardized naming)
    public static final String BOOKS = "books";
    public static final String AUTHORS = "authors";
    public static final String PUBLISHERS = "publishers";
    public static final String USERS = "users";
    public static final String GENRES = "genres";
    public static final String BOOK_TYPES = "book-types";
    
    // Action-based constants (for specific operations)
    public static final String UPLOAD = "upload";
    public static final String DOWNLOAD = "download";
    public static final String SEARCH = "search";
    public static final String HEALTH = "health";
    public static final String STATUS = "status";
    public static final String TASK = "task";
    public static final String LOGIN = "login";
    
    // Legacy constants (deprecated - for backward compatibility)
    /**
     * @deprecated Use {@link #BOOKS} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String BOOK = "book";
    
    /**
     * @deprecated Use {@link #BOOKS} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String ADDBOOK = "addbook";
    
    /**
     * @deprecated Use {@link #BOOKS} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String DELBOOK = "delbook";
    
    /**
     * @deprecated Use {@link #BOOKS} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String UPDATEBOOK = "updatebook";
    
    /**
     * @deprecated Use {@link #BOOKS} + "/search" instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String SEARCHBOOK = "searchbook";
    
    /**
     * @deprecated Use {@link #BOOK_TYPES} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String TYPE = "type";
    
    /**
     * @deprecated Use {@link #DOWNLOAD} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String DOWNLOAD_ALL = "download-all";
    
    /**
     * @deprecated Use {@link #UPLOAD} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String UPLOAD_ALL = "upload-all";
    
    /**
     * @deprecated Use {@link #USERS} + "/login" instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String USER = "user";
    

    
    /**
     * @deprecated Use {@link #USERS} + "/logout" instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String LOGOUT = "logout";
    
    /**
     * @deprecated Use {@link #STATUS} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String REQUEST_STATUS = "requestStatus";
    
    /**
     * @deprecated Use {@link #HEALTH} instead. This constant will be removed in a future version.
     */
    @Deprecated
    public static final String HEALTH_CHECK = "healthcheck";
    
    /**
     * @deprecated This constant will be removed in a future version.
     */
    @Deprecated
    public static final String SAMPLE = "sample";
    
    /**
     * @deprecated This constant will be removed in a future version.
     */
    @Deprecated
    public static final String LIST = "list";
    
    // Frontend URL (keep as is)
    public static final String BOOKFE = "http://localhost:5173";
    
    private UrlConstant() {
        // Prevent instantiation
    }
}

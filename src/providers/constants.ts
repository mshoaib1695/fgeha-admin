/** Backend API base URL – set VITE_API_URL in .env (e.g. http://localhost:8080) */
export const API_URL = import.meta.env.VITE_API_URL as string;

/** localStorage key for JWT (used by data provider auth header) */
export const TOKEN_KEY = "token";

/** localStorage key for current user (used by auth provider getIdentity) */
export const USER_KEY = "user";

/** localStorage key for most recent user interaction timestamp */
export const LAST_ACTIVITY_KEY = "admin:last-activity";

/** localStorage key for session start timestamp (absolute timeout cap) */
export const SESSION_START_KEY = "admin:session-start";

/** localStorage key used to broadcast cross-tab logout events */
export const LOGOUT_EVENT_KEY = "admin:logout-event";

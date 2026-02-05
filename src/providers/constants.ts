/** Backend API base URL – set VITE_API_URL in .env (e.g. http://localhost:8080) */
export const API_URL = import.meta.env.VITE_API_URL as string;

/** localStorage key for JWT (used by data provider auth header) */
export const TOKEN_KEY = "token";

/** localStorage key for current user (used by auth provider getIdentity) */
export const USER_KEY = "user";

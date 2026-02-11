import { useLogout } from "@refinedev/core";
import { useEffect, useRef } from "react";
import {
  LAST_ACTIVITY_KEY,
  LOGOUT_EVENT_KEY,
  SESSION_START_KEY,
  TOKEN_KEY,
} from "../providers/constants";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const ABSOLUTE_SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 5000;
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;

const parseTimestamp = (value: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function IdleSessionLogout() {
  const { mutate: logout } = useLogout();
  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const lastPersistedActivityRef = useRef<number>(0);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const now = Date.now();
    const parsedLastActivity = parseTimestamp(localStorage.getItem(LAST_ACTIVITY_KEY));
    const parsedSessionStart = parseTimestamp(localStorage.getItem(SESSION_START_KEY));

    if (parsedLastActivity) {
      lastActivityRef.current = parsedLastActivity;
      lastPersistedActivityRef.current = parsedLastActivity;
    } else {
      lastActivityRef.current = now;
      lastPersistedActivityRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }

    if (parsedSessionStart) {
      sessionStartRef.current = parsedSessionStart;
    } else {
      sessionStartRef.current = now;
      localStorage.setItem(SESSION_START_KEY, now.toString());
    }

    const triggerLogout = (reason: "idle" | "absolute" | "cross-tab") => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      localStorage.setItem(
        LOGOUT_EVENT_KEY,
        JSON.stringify({
          at: Date.now(),
          reason,
        })
      );
      logout();
    };

    const markActivity = () => {
      if (isLoggingOutRef.current) return;
      const activityAt = Date.now();
      lastActivityRef.current = activityAt;
      // Persist at a low frequency to avoid excessive localStorage writes.
      if (activityAt - lastPersistedActivityRef.current >= ACTIVITY_WRITE_THROTTLE_MS) {
        lastPersistedActivityRef.current = activityAt;
        localStorage.setItem(LAST_ACTIVITY_KEY, activityAt.toString());
      }
    };

    const checkSession = () => {
      const current = Date.now();
      if (current - sessionStartRef.current >= ABSOLUTE_SESSION_TIMEOUT_MS) {
        triggerLogout("absolute");
        return;
      }
      if (current - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        triggerLogout("idle");
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const next = parseTimestamp(event.newValue);
        if (next) {
          lastActivityRef.current = next;
          lastPersistedActivityRef.current = next;
        }
      }

      if (event.key === SESSION_START_KEY && event.newValue) {
        const next = parseTimestamp(event.newValue);
        if (next) {
          sessionStartRef.current = next;
        }
      }

      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        triggerLogout("cross-tab");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
        if (!isLoggingOutRef.current) {
          markActivity();
        }
      }
    };

    const onBlur = () => checkSession();
    const onPageHide = () => checkSession();
    const onFocus = () => {
      checkSession();
      if (!isLoggingOutRef.current) {
        markActivity();
      }
    };

    // Enforce expiration immediately when the app becomes active.
    checkSession();
    if (isLoggingOutRef.current) return;

    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, { passive: true })
    );
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("focus", onFocus);

    const intervalId = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("focus", onFocus);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, markActivity)
      );
    };
  }, [logout]);

  return null;
}

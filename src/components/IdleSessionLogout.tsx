import { useLogout } from "@refinedev/core";
import { useEffect, useRef } from "react";
import { TOKEN_KEY } from "../providers/constants";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 5000;
const LAST_ACTIVITY_KEY = "admin:last-activity";
const LOGOUT_EVENT_KEY = "admin:logout-event";

export function IdleSessionLogout() {
  const { mutate: logout } = useLogout();
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const parsedLastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    if (Number.isFinite(parsedLastActivity) && parsedLastActivity > 0) {
      lastActivityRef.current = parsedLastActivity;
    } else {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    const triggerLogout = () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
      logout();
    };

    const markActivity = () => {
      if (isLoggingOutRef.current) return;
      const now = Date.now();
      lastActivityRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    };

    const checkIdle = () => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        triggerLogout();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const next = Number(event.newValue);
        if (Number.isFinite(next) && next > 0) {
          lastActivityRef.current = next;
        }
      }

      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        triggerLogout();
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, { passive: true })
    );
    window.addEventListener("storage", onStorage);

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", onStorage);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, markActivity)
      );
    };
  }, [logout]);

  return null;
}

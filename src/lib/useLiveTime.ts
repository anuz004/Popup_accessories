import { useSyncExternalStore } from "react";

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function updateTime() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    updateTime();
    timer = setInterval(updateTime, 1000);
    document.addEventListener("visibilitychange", updateTime);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", updateTime);
    }
  };
}

/** One shared clock keeps all watch illustrations on the device's local time. */
export function useLiveTime() {
  const timestamp = useSyncExternalStore(subscribe, () => now);
  return new Date(timestamp);
}

"use client";

// Device identification and developer key management
// Used for per-device rate limiting on image generation

const DEVICE_ID_KEY = "evidencebox:device-id";
const DEV_KEY_STORAGE = "evidencebox:dev-key";

/**
 * Get or create a unique device ID stored in localStorage.
 * Used for per-device rate limiting on image generation.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Get the stored developer key (if any).
 * Used to bypass rate limits for the developer.
 */
export function getDeveloperKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEV_KEY_STORAGE);
}

/**
 * Save or clear the developer key.
 */
export function setDeveloperKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem(DEV_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(DEV_KEY_STORAGE);
  }
}

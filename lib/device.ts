"use client";

// Device identification and developer key management
// Used for per-device rate limiting on image generation

const DEVICE_ID_KEY = "evidencebox:device-id";
// Use sessionStorage for dev key — expires when browser closes, more secure than localStorage
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
 * Uses sessionStorage so the key is cleared when the browser session ends.
 */
export function getDeveloperKey(): string | null {
  if (typeof window === "undefined") return null;
  // Try sessionStorage first (more secure), fall back to localStorage for backwards compat
  return sessionStorage.getItem(DEV_KEY_STORAGE) || localStorage.getItem(DEV_KEY_STORAGE);
}

/**
 * Save or clear the developer key.
 * Uses sessionStorage for new keys (more secure).
 */
export function setDeveloperKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    // Store in sessionStorage (cleared on browser close)
    sessionStorage.setItem(DEV_KEY_STORAGE, key);
    // Remove from localStorage if it was there from old version
    localStorage.removeItem(DEV_KEY_STORAGE);
  } else {
    sessionStorage.removeItem(DEV_KEY_STORAGE);
    localStorage.removeItem(DEV_KEY_STORAGE);
  }
}

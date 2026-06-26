"use client";

// Client-side dynamic request token generation.
// Mirrors the server-side logic in middleware.ts.
// Token = base64(UTC_date + ":" + shared_secret)
// Changes daily, making replay attacks harder than a static header.

const REQUEST_SECRET = "eb_req_v1_9f3a7c2d8e1b";

/**
 * Generate a dynamic token for API request authentication.
 */
export function getRequestToken(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return btoa(today + ":" + REQUEST_SECRET);
}

/**
 * Get the standard headers for API requests, including the auth token.
 */
export function getApiHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-eb-token": getRequestToken(),
    "x-evidencebox-request": "1",
    ...extra,
  };
}

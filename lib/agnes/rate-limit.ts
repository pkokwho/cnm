import "server-only";

// Simple in-memory sliding window rate limiter.
// On Vercel serverless, each instance has its own counter.
// This is imprecise across instances but provides a baseline defense.
// The middleware.ts origin check is the primary defense against external abuse.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 18; // leave 2 as buffer under the 20 RPM limit

// Global counter (all requests on this instance)
const globalTimestamps: number[] = [];

export function checkRateLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  // Clean expired timestamps
  while (globalTimestamps.length > 0 && globalTimestamps[0] < now - WINDOW_MS) {
    globalTimestamps.shift();
  }
  if (globalTimestamps.length >= MAX_REQUESTS) {
    const oldest = globalTimestamps[0];
    const retryAfterMs = oldest + WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }
  globalTimestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

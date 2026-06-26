// Simple in-memory sliding window rate limiter.
// On Vercel serverless, each instance has its own counter.
// This is imprecise across instances but sufficient for the 20 RPM constraint.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 18; // leave 2 as buffer under the 20 RPM limit

const timestamps: number[] = [];

export function checkRateLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  // Clean expired timestamps
  while (timestamps.length > 0 && timestamps[0] < now - WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfterMs = oldest + WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }
  timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// Per-device image generation rate limiter
// Constraint: 1 image per device per 10 minutes
// Developers bypass this limit entirely
//
// Note: On Vercel serverless, each instance has its own Map.
// This is imprecise across instances but sufficient as a server-side
// backup to the client-side localStorage check.

const IMAGE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Map<deviceId, lastGeneratedTimestamp>
const deviceTimestamps = new Map<string, number>();

// Hard cap to prevent memory leaks in attack scenarios
const MAX_ENTRIES = 10000;

function cleanup() {
  const now = Date.now();
  for (const [id, ts] of deviceTimestamps) {
    if (now - ts > IMAGE_WINDOW_MS) {
      deviceTimestamps.delete(id);
    }
  }
  if (deviceTimestamps.size > MAX_ENTRIES) {
    const sorted = [...deviceTimestamps.entries()].sort((a, b) => a[1] - b[1]);
    const toRemove = sorted.length - MAX_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      deviceTimestamps.delete(sorted[i][0]);
    }
  }
}

/**
 * Check if a device is allowed to generate an image.
 * Does NOT record the generation — call recordImageGeneration() after success.
 */
export function checkImageRateLimit(
  deviceId: string
): { allowed: boolean; retryAfterMs: number } {
  cleanup();

  const now = Date.now();
  const lastGen = deviceTimestamps.get(deviceId);

  if (lastGen && now - lastGen < IMAGE_WINDOW_MS) {
    const retryAfterMs = lastGen + IMAGE_WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Record a successful image generation for a device.
 * Call this ONLY after the image was successfully generated.
 */
export function recordImageGeneration(deviceId: string): void {
  deviceTimestamps.set(deviceId, Date.now());
}

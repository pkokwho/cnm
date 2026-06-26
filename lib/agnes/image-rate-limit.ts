// Per-device daily credit system for image generation
// Each device gets 3 credits per day (midnight reset, Beijing time)
// Developers bypass this limit entirely
//
// On Vercel serverless, each instance has its own Map.
// We track by BOTH deviceId AND client IP for defense in depth.
// Client-side localStorage is the primary UX defense; this is the server-side enforcement.

interface CreditRecord {
  date: string; // YYYY-MM-DD (Beijing time)
  creditsUsed: number;
  lastIp?: string;
}

const DAILY_CREDIT_LIMIT = 3;

// Map<deviceId, CreditRecord> — primary tracking
const deviceCredits = new Map<string, CreditRecord>();
// Map<ip, CreditRecord> — secondary tracking (catches deviceId rotation)
const ipCredits = new Map<string, CreditRecord>();

// Hard cap to prevent memory leaks
const MAX_ENTRIES = 10000;

function getBeijingDate(): string {
  // Convert to Beijing time (UTC+8)
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10); // YYYY-MM-DD
}

function cleanup() {
  const today = getBeijingDate();
  for (const [id, record] of deviceCredits) {
    if (record.date !== today) deviceCredits.delete(id);
  }
  for (const [ip, record] of ipCredits) {
    if (record.date !== today) ipCredits.delete(ip);
  }
  if (deviceCredits.size > MAX_ENTRIES) deviceCredits.clear();
  if (ipCredits.size > MAX_ENTRIES) ipCredits.clear();
}

/**
 * Check if a device has remaining credits.
 * Uses BOTH deviceId and client IP for tracking — the stricter of the two applies.
 * Does NOT consume a credit — call consumeCredit() after successful generation.
 */
export function checkImageCredits(
  deviceId: string,
  clientIp?: string
): { allowed: boolean; remaining: number; limit: number } {
  cleanup();

  const today = getBeijingDate();

  // Check deviceId tracking
  const devRecord = deviceCredits.get(deviceId);
  let devUsed = 0;
  if (devRecord && devRecord.date === today) {
    devUsed = devRecord.creditsUsed;
  }

  // Check IP tracking (secondary defense against deviceId rotation)
  let ipUsed = 0;
  if (clientIp) {
    const ipRecord = ipCredits.get(clientIp);
    if (ipRecord && ipRecord.date === today) {
      ipUsed = ipRecord.creditsUsed;
    }
  }

  // Use the higher usage count (stricter enforcement)
  const effectiveUsed = Math.max(devUsed, ipUsed);
  const remaining = DAILY_CREDIT_LIMIT - effectiveUsed;
  return {
    allowed: remaining > 0,
    remaining: Math.max(remaining, 0),
    limit: DAILY_CREDIT_LIMIT,
  };
}

/**
 * Consume one credit for a device (after successful generation).
 * Records consumption in both deviceId and IP maps.
 */
export function consumeCredit(deviceId: string, clientIp?: string): void {
  const today = getBeijingDate();

  // Update deviceId tracking
  const devRecord = deviceCredits.get(deviceId);
  if (!devRecord || devRecord.date !== today) {
    deviceCredits.set(deviceId, { date: today, creditsUsed: 1, lastIp: clientIp });
  } else {
    devRecord.creditsUsed += 1;
    devRecord.lastIp = clientIp;
  }

  // Update IP tracking
  if (clientIp) {
    const ipRecord = ipCredits.get(clientIp);
    if (!ipRecord || ipRecord.date !== today) {
      ipCredits.set(clientIp, { date: today, creditsUsed: 1 });
    } else {
      ipRecord.creditsUsed += 1;
    }
  }
}

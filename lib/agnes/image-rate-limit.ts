// Per-device daily credit system for image generation
// Each device gets 3 credits per day (midnight reset, Beijing time)
// Developers bypass this limit entirely
//
// Note: On Vercel serverless, each instance has its own Map.
// Client-side localStorage is the primary defense; this is the server-side backup.

interface CreditRecord {
  date: string; // YYYY-MM-DD (Beijing time)
  creditsUsed: number;
}

const DAILY_CREDIT_LIMIT = 3;

// Map<deviceId, CreditRecord>
const deviceCredits = new Map<string, CreditRecord>();

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
    if (record.date !== today) {
      deviceCredits.delete(id);
    }
  }
  if (deviceCredits.size > MAX_ENTRIES) {
    deviceCredits.clear(); // Emergency cleanup
  }
}

/**
 * Check if a device has remaining credits.
 * Does NOT consume a credit — call consumeCredit() after successful generation.
 */
export function checkImageCredits(
  deviceId: string
): { allowed: boolean; remaining: number; limit: number } {
  cleanup();

  const today = getBeijingDate();
  const record = deviceCredits.get(deviceId);

  if (!record || record.date !== today) {
    return { allowed: true, remaining: DAILY_CREDIT_LIMIT, limit: DAILY_CREDIT_LIMIT };
  }

  const remaining = DAILY_CREDIT_LIMIT - record.creditsUsed;
  return {
    allowed: remaining > 0,
    remaining: Math.max(remaining, 0),
    limit: DAILY_CREDIT_LIMIT,
  };
}

/**
 * Consume one credit for a device (after successful generation).
 */
export function consumeCredit(deviceId: string): void {
  const today = getBeijingDate();
  const record = deviceCredits.get(deviceId);

  if (!record || record.date !== today) {
    deviceCredits.set(deviceId, { date: today, creditsUsed: 1 });
  } else {
    record.creditsUsed += 1;
  }
}

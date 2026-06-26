import { NextRequest, NextResponse } from "next/server";

// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  "https://evidencebox-app.vercel.app",
  "https://evidencebox.pages.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Secret for dynamic request token (changes daily)
const REQUEST_SECRET = "eb_req_v1_9f3a7c2d8e1b";

// Maximum request body size (2MB — covers file uploads up to 20MB via multipart,
// but JSON API bodies are capped much lower)
const MAX_JSON_BODY_SIZE = 2 * 1024 * 1024; // 2MB for JSON APIs

// Global rate limiting (per Edge instance)
// Edge Runtime instances are longer-lived than serverless functions,
// so this provides better coverage than per-function rate limits
const GLOBAL_RATE_WINDOW_MS = 60_000; // 1 minute
const GLOBAL_RATE_MAX = 30; // max 30 API requests per minute per IP
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Generate expected token: base64(UTC_date + ":" + secret)
 * Uses btoa (Web API) since middleware runs on Edge Runtime (no Node.js Buffer)
 */
function generateExpectedToken(): string {
  const today = new Date().toISOString().slice(0, 10);
  return btoa(today + ":" + REQUEST_SECRET);
}

/**
 * Check global rate limit for an IP address.
 * Runs on Edge Runtime — more persistent than serverless functions.
 */
function checkGlobalRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || record.resetAt < now) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + GLOBAL_RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= GLOBAL_RATE_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Cleanup old entries periodically to prevent memory leaks
let lastCleanup = Date.now();
function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) { // every 5 minutes
    for (const [ip, record] of ipRequestCounts) {
      if (record.resetAt < now) {
        ipRequestCounts.delete(ip);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  cleanupIfNeeded();

  // Get client IP for rate limiting
  const clientIp = getClientIp(request);

  // Global rate limiting (applies to ALL API requests)
  if (!checkGlobalRateLimit(clientIp)) {
    return NextResponse.json(
      { success: false, error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Check Content-Length for JSON APIs (not multipart/form-data which can be larger)
  const contentType = request.headers.get("content-type") || "";
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);

  if (contentType.includes("application/json") && contentLength > MAX_JSON_BODY_SIZE) {
    return NextResponse.json(
      { success: false, error: "请求体过大" },
      { status: 413 }
    );
  }

  // For non-GET requests, validate origin
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const token = request.headers.get("x-eb-token");

    let originValid = false;
    let hasOriginInfo = false;

    if (origin) {
      hasOriginInfo = true;
      originValid = ALLOWED_ORIGINS.includes(origin);
    } else if (referer) {
      hasOriginInfo = true;
      try {
        const refererUrl = new URL(referer);
        originValid = ALLOWED_ORIGINS.includes(refererUrl.origin);
      } catch {
        originValid = false;
      }
    }

    // If origin/referer is present but invalid → block immediately
    if (hasOriginInfo && !originValid) {
      return NextResponse.json(
        { success: false, error: "请求来源不被允许" },
        { status: 403 }
      );
    }

    // If no origin/referer (direct curl/script call), require valid token
    if (!hasOriginInfo) {
      const expected = generateExpectedToken();
      if (token !== expected) {
        return NextResponse.json(
          { success: false, error: "请求来源不被允许" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

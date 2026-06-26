import { NextRequest, NextResponse } from "next/server";

// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  "https://evidencebox-app.vercel.app",
  "https://evidencebox.pages.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Secret used for dynamic request token validation.
// Compiled into client bundle — not truly secret, but raises the bar
// significantly vs a static header value like "1".
const REQUEST_SECRET = "eb_req_v1_9f3a7c2d8e1b";

/**
 * Generate expected token: base64(UTC_date + ":" + secret)
 * Must match client-side getRequestToken() in lib/request-token.ts
 */
function generateExpectedToken(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return Buffer.from(today + ":" + REQUEST_SECRET).toString("base64");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For non-GET requests, validate origin
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const token = request.headers.get("x-eb-token");

    let originValid = false;
    let hasOriginInfo = false;

    // Check Origin header (most reliable for browser CORS)
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

import { NextRequest, NextResponse } from "next/server";

// Allowed origins for API requests
// Prevents unauthorized external sites from calling our APIs
const ALLOWED_ORIGINS = [
  "https://evidencebox-app.vercel.app",
  "https://evidencebox.pages.dev",
  // Local development
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Paths that require origin validation
const PROTECTED_API_PREFIX = "/api/";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith(PROTECTED_API_PREFIX)) {
    return NextResponse.next();
  }

  // For non-GET requests (POST, PUT, DELETE), validate origin
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Check Origin header first (most reliable for CORS)
    if (origin) {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        return NextResponse.json(
          { success: false, error: "请求来源不被允许" },
          { status: 403 }
        );
      }
    } else if (referer) {
      // Fallback: check Referer header
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = refererUrl.origin;
        if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
          return NextResponse.json(
            { success: false, error: "请求来源不被允许" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "请求来源不被允许" },
          { status: 403 }
        );
      }
    } else {
      // No Origin or Referer header — likely a direct curl/script call
      // Allow only if a custom header is present (proves it's from our frontend)
      const customHeader = request.headers.get("x-evidencebox-request");
      if (customHeader !== "1") {
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

import type { NextConfig } from "next";

// `better-sqlite3` is a native addon (a `.node` binary built with node-gyp).
// Such binaries cannot be loaded inside Vercel's serverless Lambda runtime
// (ERR_DLOPEN_FAILED), so we must NEVER bundle the addon into the server
// output. `serverExternalPackages` keeps it as a runtime `require()` instead.
//
// We externalise it in EVERY environment:
//   - Locally: better-sqlite3 is installed (optional dependency), the SqliteStore
//     loads it at runtime via the dynamic require in lib/store/index.ts.
//   - On Vercel: the SqliteStore code path is never executed (the in-memory
//     store is used instead), so the externalised `require("better-sqlite3")`
//     is never called. Externalising it is also what lets `next build` succeed
//     on Vercel even when the native module is absent from node_modules.
//
// Making this conditional-off on Vercel would be unsafe: the SQLite store module
// is still part of the bundle graph, so the bundler would attempt to resolve /
// bundle the native addon and either fail the build or ship a broken binary.
const serverExternalPackages = ["better-sqlite3"];

const nextConfig: NextConfig = {
  serverExternalPackages,
  allowedDevOrigins: [
    "run-agent-6a3c8ee53d912239e30a5cd5-mqut59c6.remote-agent.svc.cluster.local",
    "localhost",
    "127.0.0.1",
  ],
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;

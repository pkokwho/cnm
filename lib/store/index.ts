import type { StoreInterface } from "./types";
import { getGlobalMemoryStore } from "./memory";

/**
 * Auto-detect which store implementation to use.
 *
 * - On Vercel (or when SQLite is explicitly disabled) we always use the
 *   in-memory store, because `better-sqlite3` is a native module that cannot
 *   be loaded inside a serverless function.
 * - Everywhere else we try the SQLite store first (local development with the
 *   existing `evidencebox.db` + `uploads/` setup), falling back to the
 *   in-memory store if `better-sqlite3` fails to load for any reason.
 *
 * The selection happens synchronously at module load. The SQLite module is
 * loaded with a dynamic `require()` so that `better-sqlite3` is never pulled
 * into the bundle / loaded at runtime on Vercel.
 */
function createStore(): StoreInterface {
  if (process.env.VERCEL || process.env.DISABLE_SQLITE) {
    return getGlobalMemoryStore();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteStore } = require("./sqlite") as typeof import("./sqlite");
    return new SqliteStore();
  } catch {
    // better-sqlite3 unavailable -> fall back to the in-memory store.
    return getGlobalMemoryStore();
  }
}

export const store: StoreInterface = createStore();

export type {
  AnalysisResultInput,
  AnalysisResultRecord,
  CaseRecord,
  MaterialRecord,
  StoreInterface,
} from "./types";

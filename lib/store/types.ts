/**
 * Unified data-store types for EvidenceBox.
 *
 * These record types intentionally mirror the shapes already consumed by the
 * API responses and the React client (e.g. `sizeBytes`, `category`,
 * `errorMsg` and integer epoch timestamps), so that swapping the persistence
 * layer from raw drizzle/SQLite to the store abstraction does NOT change the
 * JSON contract of any route.
 */

export interface CaseRecord {
  id: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface MaterialRecord {
  id: string;
  caseId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  category: string | null;
  status: string; // "uploaded" | "extracting" | "extracted" | "failed"
  extractedText: string | null;
  extractedMeta: string | null;
  errorMsg: string | null;
  createdAt: number;
}

export interface AnalysisResultRecord {
  id: string;
  caseId: string;
  timeline: string; // JSON string
  summary: string; // JSON string
  todos: string; // JSON string
  suggestions: string; // JSON string
  engineUsed: string;
  createdAt: number;
}

export interface AnalysisResultInput {
  timeline: string;
  summary: string;
  todos: string;
  suggestions: string;
}

/**
 * A single interface implemented by both the SQLite-backed store (local dev)
 * and the in-memory store (Vercel / serverless). All file-storage methods are
 * synchronous so the in-memory implementation can stay simple; the SQLite
 * implementation uses the blocking `fs` APIs (better-sqlite3 itself is sync).
 */
export interface StoreInterface {
  // Cases
  getCases(): CaseRecord[];
  getCase(id: string): CaseRecord | undefined;
  createCase(id: string, title: string): CaseRecord;
  updateCaseStatus(id: string, status: string): void;
  deleteCase(id: string): void;

  // Materials
  getMaterialsByCaseId(caseId: string): MaterialRecord[];
  getMaterial(id: string): MaterialRecord | undefined;
  createMaterial(data: Omit<MaterialRecord, "createdAt">): MaterialRecord;
  updateMaterial(id: string, data: Partial<MaterialRecord>): void;
  deleteMaterialsByCaseId(caseId: string): void;

  // Analysis results
  getAnalysisResult(caseId: string): AnalysisResultRecord | undefined;
  saveAnalysisResult(
    id: string,
    caseId: string,
    result: AnalysisResultInput
  ): void;
  deleteAnalysisResult(caseId: string): void;

  // File storage
  saveFile(key: string, buffer: Buffer): void;
  getFileBuffer(key: string): Buffer | undefined;
  /**
   * Returns a filesystem path for `key`. In SQLite mode this is the real path
   * on disk. In memory mode the buffer is materialised to /tmp so that tools
   * which require a path (none by default after the processor refactor) can
   * still read it.
   */
  getFilePath(key: string): string;
  deleteFile(key: string): void;
}

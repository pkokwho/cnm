import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import type {
  AnalysisResultInput,
  AnalysisResultRecord,
  CaseRecord,
  MaterialRecord,
  StoreInterface,
} from "./types";

/**
 * In-memory store used on Vercel (and as a fallback when better-sqlite3 is not
 * available). Data is kept in Maps and persisted on `globalThis` so it survives
 * warm serverless function invocations and Next.js dev hot-reloads.
 *
 * NOTE: This is inherently ephemeral. A cold start of a brand-new serverless
 * instance starts with an empty store. For EvidenceBox this is acceptable on
 * Vercel (sessions are short-lived); persistent local development still uses
 * the SQLite store.
 */

// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var __evidenceboxStore: MemoryStore | undefined;
}

export class MemoryStore implements StoreInterface {
  private cases = new Map<string, CaseRecord>();
  private materials = new Map<string, MaterialRecord>();
  private results = new Map<string, AnalysisResultRecord>();
  private files = new Map<string, Buffer>();

  // ---- Cases --------------------------------------------------------------
  getCases(): CaseRecord[] {
    return Array.from(this.cases.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  getCase(id: string): CaseRecord | undefined {
    return this.cases.get(id);
  }

  createCase(id: string, title: string): CaseRecord {
    const now = Date.now();
    const record: CaseRecord = {
      id,
      title,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };
    this.cases.set(id, record);
    return record;
  }

  updateCaseStatus(id: string, status: string): void {
    const record = this.cases.get(id);
    if (!record) return;
    record.status = status;
    record.updatedAt = Date.now();
  }

  deleteCase(id: string): void {
    // Remove related materials (and their files) and analysis results.
    for (const material of Array.from(this.materials.values())) {
      if (material.caseId === id) {
        if (material.storageKey) this.deleteFile(material.storageKey);
        this.materials.delete(material.id);
      }
    }
    for (const result of Array.from(this.results.values())) {
      if (result.caseId === id) this.results.delete(result.id);
    }
    this.cases.delete(id);
  }

  // ---- Materials ----------------------------------------------------------
  getMaterialsByCaseId(caseId: string): MaterialRecord[] {
    return Array.from(this.materials.values())
      .filter((m) => m.caseId === caseId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  getMaterial(id: string): MaterialRecord | undefined {
    return this.materials.get(id);
  }

  createMaterial(data: Omit<MaterialRecord, "createdAt">): MaterialRecord {
    const record: MaterialRecord = { ...data, createdAt: Date.now() };
    this.materials.set(record.id, record);
    return record;
  }

  updateMaterial(id: string, data: Partial<MaterialRecord>): void {
    const record = this.materials.get(id);
    if (!record) return;
    Object.assign(record, data);
  }

  deleteMaterialsByCaseId(caseId: string): void {
    for (const material of Array.from(this.materials.values())) {
      if (material.caseId === caseId) {
        if (material.storageKey) this.deleteFile(material.storageKey);
        this.materials.delete(material.id);
      }
    }
  }

  // ---- Analysis results ---------------------------------------------------
  getAnalysisResult(caseId: string): AnalysisResultRecord | undefined {
    for (const result of this.results.values()) {
      if (result.caseId === caseId) return result;
    }
    return undefined;
  }

  saveAnalysisResult(
    id: string,
    caseId: string,
    result: AnalysisResultInput
  ): void {
    // Replace any existing result for this case.
    this.deleteAnalysisResult(caseId);
    const record: AnalysisResultRecord = {
      id,
      caseId,
      timeline: result.timeline,
      summary: result.summary,
      todos: result.todos,
      suggestions: result.suggestions,
      engineUsed: "local-rules-v1",
      createdAt: Date.now(),
    };
    this.results.set(id, record);
  }

  deleteAnalysisResult(caseId: string): void {
    for (const result of Array.from(this.results.values())) {
      if (result.caseId === caseId) this.results.delete(result.id);
    }
  }

  // ---- File storage -------------------------------------------------------
  saveFile(key: string, buffer: Buffer): void {
    this.files.set(key, buffer);
  }

  getFileBuffer(key: string): Buffer | undefined {
    return this.files.get(key);
  }

  getFilePath(key: string): string {
    // No real file exists in memory mode, so materialise the buffer to /tmp so
    // that any consumer requiring a path can still read it.
    const tmpPath = path.join("/tmp", "evidencebox", key);
    const buffer = this.files.get(key);
    if (buffer) {
      const dir = path.dirname(tmpPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(tmpPath, buffer);
    }
    return tmpPath;
  }

  deleteFile(key: string): void {
    this.files.delete(key);
  }
}

/**
 * Returns the process-wide singleton MemoryStore, stored on `globalThis` so it
 * persists across warm serverless invocations and dev hot-reloads.
 */
export function getGlobalMemoryStore(): MemoryStore {
  if (!globalThis.__evidenceboxStore) {
    globalThis.__evidenceboxStore = new MemoryStore();
  }
  return globalThis.__evidenceboxStore;
}

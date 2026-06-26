import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analysisResults, cases, materials } from "@/lib/db/schema";
import type {
  AnalysisResultInput,
  AnalysisResultRecord,
  CaseRecord,
  MaterialRecord,
  StoreInterface,
} from "./types";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * SQLite-backed store used for local development. It is a thin wrapper around
 * the existing drizzle `getDb()` instance and the `uploads/` directory, so all
 * previously created data continues to work unchanged.
 *
 * This module transitively imports `better-sqlite3` (via `@/lib/db`), so it is
 * only loaded dynamically by `lib/store/index.ts` when SQLite is actually in
 * use (i.e. NOT on Vercel).
 */
export class SqliteStore implements StoreInterface {
  // ---- Cases --------------------------------------------------------------
  getCases(): CaseRecord[] {
    const db = getDb();
    return db
      .select()
      .from(cases)
      .orderBy(desc(cases.createdAt))
      .all() as CaseRecord[];
  }

  getCase(id: string): CaseRecord | undefined {
    const db = getDb();
    return db.select().from(cases).where(eq(cases.id, id)).get() as
      | CaseRecord
      | undefined;
  }

  createCase(id: string, title: string): CaseRecord {
    const db = getDb();
    const now = Date.now();
    db.insert(cases)
      .values({
        id,
        title,
        status: "created",
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return this.getCase(id)!;
  }

  updateCaseStatus(id: string, status: string): void {
    const db = getDb();
    db.update(cases)
      .set({ status, updatedAt: Date.now() })
      .where(eq(cases.id, id))
      .run();
  }

  deleteCase(id: string): void {
    const db = getDb();
    // Delete attached files first (foreign-key cascade handles the rows).
    const caseMaterials = this.getMaterialsByCaseId(id);
    for (const material of caseMaterials) {
      if (material.storageKey) this.deleteFile(material.storageKey);
    }
    db.delete(cases).where(eq(cases.id, id)).run();
  }

  // ---- Materials ----------------------------------------------------------
  getMaterialsByCaseId(caseId: string): MaterialRecord[] {
    const db = getDb();
    return db
      .select()
      .from(materials)
      .where(eq(materials.caseId, caseId))
      .all() as MaterialRecord[];
  }

  getMaterial(id: string): MaterialRecord | undefined {
    const db = getDb();
    return db.select().from(materials).where(eq(materials.id, id)).get() as
      | MaterialRecord
      | undefined;
  }

  createMaterial(data: Omit<MaterialRecord, "createdAt">): MaterialRecord {
    const db = getDb();
    db.insert(materials)
      .values({
        id: data.id,
        caseId: data.caseId,
        originalName: data.originalName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        category: data.category,
        status: data.status,
        extractedText: data.extractedText,
        extractedMeta: data.extractedMeta,
        errorMsg: data.errorMsg,
        createdAt: Date.now(),
      })
      .run();
    return this.getMaterial(data.id)!;
  }

  updateMaterial(id: string, data: Partial<MaterialRecord>): void {
    const db = getDb();
    const update: Partial<typeof materials.$inferInsert> = {};
    if (data.caseId !== undefined) update.caseId = data.caseId;
    if (data.originalName !== undefined) update.originalName = data.originalName;
    if (data.mimeType !== undefined) update.mimeType = data.mimeType;
    if (data.sizeBytes !== undefined) update.sizeBytes = data.sizeBytes;
    if (data.storageKey !== undefined) update.storageKey = data.storageKey;
    if (data.category !== undefined) update.category = data.category;
    if (data.status !== undefined) update.status = data.status;
    if (data.extractedText !== undefined) update.extractedText = data.extractedText;
    if (data.extractedMeta !== undefined) update.extractedMeta = data.extractedMeta;
    if (data.errorMsg !== undefined) update.errorMsg = data.errorMsg;
    if (data.createdAt !== undefined) update.createdAt = data.createdAt;
    db.update(materials).set(update).where(eq(materials.id, id)).run();
  }

  deleteMaterialsByCaseId(caseId: string): void {
    const db = getDb();
    const caseMaterials = this.getMaterialsByCaseId(caseId);
    for (const material of caseMaterials) {
      if (material.storageKey) this.deleteFile(material.storageKey);
    }
    db.delete(materials).where(eq(materials.caseId, caseId)).run();
  }

  // ---- Analysis results ---------------------------------------------------
  getAnalysisResult(caseId: string): AnalysisResultRecord | undefined {
    const db = getDb();
    return db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.caseId, caseId))
      .get() as AnalysisResultRecord | undefined;
  }

  saveAnalysisResult(
    id: string,
    caseId: string,
    result: AnalysisResultInput
  ): void {
    const db = getDb();
    // Replace any existing result for this case.
    this.deleteAnalysisResult(caseId);
    db.insert(analysisResults)
      .values({
        id,
        caseId,
        timeline: result.timeline,
        summary: result.summary,
        todos: result.todos,
        suggestions: result.suggestions,
        engineUsed: "local-rules-v1",
        createdAt: Date.now(),
      })
      .run();
  }

  deleteAnalysisResult(caseId: string): void {
    const db = getDb();
    db.delete(analysisResults)
      .where(eq(analysisResults.caseId, caseId))
      .run();
  }

  // ---- File storage -------------------------------------------------------
  saveFile(key: string, buffer: Buffer): void {
    ensureUploadDir();
    writeFileSync(path.join(UPLOAD_DIR, key), buffer);
  }

  getFileBuffer(key: string): Buffer | undefined {
    const filePath = path.join(UPLOAD_DIR, key);
    if (!existsSync(filePath)) return undefined;
    return readFileSync(filePath);
  }

  getFilePath(key: string): string {
    return path.join(UPLOAD_DIR, key);
  }

  deleteFile(key: string): void {
    try {
      unlinkSync(path.join(UPLOAD_DIR, key));
    } catch {
      // File may not exist; ignore.
    }
  }
}

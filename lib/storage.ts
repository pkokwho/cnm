import crypto from "crypto";
import { store } from "@/lib/store";

/**
 * Thin facade over the unified data store.
 *
 * The public function signatures are kept identical to the previous
 * filesystem-only implementation (`saveFile(buffer, ext)`, `getFile(key)`,
 * `getFilePath(key)`, `deleteFile(key)`) so that any code that still imports
 * from `@/lib/storage` continues to work. Internally everything delegates to
 * `store`, which means files are stored on disk in SQLite mode and in memory
 * (or /tmp on demand) in memory mode.
 */

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  const storageKey = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
  store.saveFile(storageKey, buffer);
  return storageKey;
}

export function getFileBuffer(storageKey: string): Buffer | undefined {
  return store.getFileBuffer(storageKey);
}

export async function getFile(storageKey: string): Promise<Buffer> {
  const buffer = store.getFileBuffer(storageKey);
  if (!buffer) {
    throw new Error(`File not found: ${storageKey}`);
  }
  return buffer;
}

export function getFilePath(storageKey: string): string {
  return store.getFilePath(storageKey);
}

export async function deleteFile(storageKey: string): Promise<void> {
  store.deleteFile(storageKey);
}

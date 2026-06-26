"use client";

// Client-side storage layer using localStorage + IndexedDB
// This solves the Vercel serverless state problem: all data lives in the browser,
// the server only processes data (extract text, run analysis) and returns results.

const DB_NAME = "evidencebox";
const DB_VERSION = 1;
const STORE_FILES = "files";

// ===== Types =====
export interface ClientCase {
  id: string;
  title: string;
  status: string; // created | uploading | extracting | analyzing | ready | failed
  createdAt: number;
  updatedAt: number;
}

export interface ClientMaterial {
  id: string;
  caseId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string; // text | pdf | image
  status: string; // uploaded | extracting | extracted | failed
  extractedText: string | null;
  errorMsg: string | null;
  createdAt: number;
}

export interface ClientAnalysisResult {
  timeline: any[];
  summary: any;
  todos: any[];
  suggestions: any[];
  engine?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ===== IndexedDB for file blobs =====
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<ArrayBuffer | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readonly");
    const req = tx.objectStore(STORE_FILES).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: ArrayBuffer): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    tx.objectStore(STORE_FILES).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    tx.objectStore(STORE_FILES).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===== localStorage for case/material metadata =====
const CASES_KEY = "evidencebox:cases";
const MATERIALS_KEY = "evidencebox:materials";
const RESULTS_KEY = "evidencebox:results";

function loadCases(): Record<string, ClientCase> {
  try {
    return JSON.parse(localStorage.getItem(CASES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCases(cases: Record<string, ClientCase>) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

function loadMaterials(): Record<string, ClientMaterial> {
  try {
    return JSON.parse(localStorage.getItem(MATERIALS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMaterials(materials: Record<string, ClientMaterial>) {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

function loadResults(): Record<string, ClientAnalysisResult> {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveResults(results: Record<string, ClientAnalysisResult>) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

// ===== Public API =====

// Cases
export function getCases(): ClientCase[] {
  const cases = loadCases();
  return Object.values(cases).sort((a, b) => b.createdAt - a.createdAt);
}

export function getCase(id: string): ClientCase | null {
  return loadCases()[id] || null;
}

export function createCase(id: string, title: string): ClientCase {
  const now = Date.now();
  const caseData: ClientCase = {
    id,
    title,
    status: "created",
    createdAt: now,
    updatedAt: now,
  };
  const cases = loadCases();
  cases[id] = caseData;
  saveCases(cases);
  return caseData;
}

export function updateCaseStatus(id: string, status: string) {
  const cases = loadCases();
  if (cases[id]) {
    cases[id].status = status;
    cases[id].updatedAt = Date.now();
    saveCases(cases);
  }
}

export function deleteCase(id: string) {
  const cases = loadCases();
  delete cases[id];
  saveCases(cases);

  // Delete materials and their files
  const materials = loadMaterials();
  const toDelete = Object.values(materials).filter((m) => m.caseId === id);
  for (const m of toDelete) {
    delete materials[m.id];
    idbDelete(m.id).catch(() => {});
  }
  saveMaterials(materials);

  // Delete results
  const results = loadResults();
  delete results[id];
  saveResults(results);
}

// Materials
export function getMaterialsByCaseId(caseId: string): ClientMaterial[] {
  const materials = loadMaterials();
  return Object.values(materials)
    .filter((m) => m.caseId === caseId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function createMaterial(
  id: string,
  caseId: string,
  file: File
): ClientMaterial {
  const material: ClientMaterial = {
    id,
    caseId,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    category: getMimeTypeCategory(file.type),
    status: "uploaded",
    extractedText: null,
    errorMsg: null,
    createdAt: Date.now(),
  };
  const materials = loadMaterials();
  materials[id] = material;
  saveMaterials(materials);
  return material;
}

export function updateMaterial(
  id: string,
  data: Partial<ClientMaterial>
) {
  const materials = loadMaterials();
  if (materials[id]) {
    materials[id] = { ...materials[id], ...data };
    saveMaterials(materials);
  }
}

// File blobs (IndexedDB)
export async function saveFileBlob(id: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  await idbSet(id, buffer);
}

export async function getFileBlob(id: string): Promise<ArrayBuffer | null> {
  return idbGet(id);
}

export async function getFileAsBuffer(id: string): Promise<Buffer | null> {
  const blob = await idbGet(id);
  if (!blob) return null;
  return Buffer.from(blob);
}

// Analysis results
export function getAnalysisResult(caseId: string): ClientAnalysisResult | null {
  return loadResults()[caseId] || null;
}

export function saveAnalysisResult(
  caseId: string,
  result: ClientAnalysisResult
) {
  const results = loadResults();
  results[caseId] = result;
  saveResults(results);
}

// Helper
function getMimeTypeCategory(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "text";
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ===== Chat History =====
const CHAT_KEY_PREFIX = "evidencebox:chat:";

export function getChatHistory(caseId: string): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(`${CHAT_KEY_PREFIX}${caseId}`) || "[]");
  } catch {
    return [];
  }
}

export function saveChatMessage(caseId: string, message: ChatMessage) {
  const history = getChatHistory(caseId);
  history.push(message);
  const trimmed = history.slice(-100);
  localStorage.setItem(`${CHAT_KEY_PREFIX}${caseId}`, JSON.stringify(trimmed));
}

export function clearChatHistory(caseId: string) {
  localStorage.removeItem(`${CHAT_KEY_PREFIX}${caseId}`);
}
